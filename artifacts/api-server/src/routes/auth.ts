import { db, auditEventsTable, sessionsTable, usersTable, walletBalancesTable } from "@workspace/db";
import { GetAccountResponse } from "@workspace/api-zod";
import { and, count, eq, ne, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  generateAccountKey,
  generateSessionToken,
  hashAccountKey,
  hashSessionToken,
  isValidAccountKey,
  isValidUsername,
  verifyAccountKey,
} from "../lib/auth";
import { accountDto, newReferralCode, observedPublicIp } from "../lib/bitgold";
import {
  requireActiveAccount,
  requireSignedIn,
} from "../middlewares/bitgoldAuth";

const router: IRouter = Router();

const WALLET_SYMBOLS = ["BTG", "BTC", "USDT"];

async function accountWithBalance(userId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return null;
  const [balance] = await db
    .select()
    .from(walletBalancesTable)
    .where(and(eq(walletBalancesTable.userId, userId), eq(walletBalancesTable.assetSymbol, "BTG")))
    .limit(1);
  return accountDto(user, balance?.availableBalance ?? "0", balance?.pendingBalance ?? "0");
}

function bodyString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function recordAuthEvent(
  action: string,
  targetId: string,
  details: Record<string, unknown>,
  actorUserId: string | null = null,
): Promise<void> {
  await db.insert(auditEventsTable).values({
    actorUserId,
    action,
    targetType: "user",
    targetId,
    details,
  });
}

router.post("/auth/signup", async (req, res): Promise<void> => {
  const username = bodyString(req.body?.username);
  const referralCode = bodyString(req.body?.referralCode).toUpperCase();
  if (!isValidUsername(username)) {
    res.status(400).json({
      error: "Usernames must be 3-32 characters using letters, numbers, dots, dashes or underscores.",
    });
    return;
  }

  const accountKey = generateAccountKey();
  const keyHash = await hashAccountKey(accountKey);
  const publicIp = observedPublicIp(req.header("x-forwarded-for"), req.ip);

  const outcome = await db.transaction(async (tx) => {
    // Serialize first-user assignment so only one concurrent signup can become admin.
    await tx.execute(sql`select pg_advisory_xact_lock(684721059)`);

    const [clash] = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(sql`lower(${usersTable.username}) = lower(${username})`)
      .limit(1);
    if (clash) {
      return { error: "That username is already taken", status: 409 as const };
    }

    let referralCodeValue = newReferralCode();
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const [collision] = await tx
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.referralCode, referralCodeValue))
        .limit(1);
      if (!collision) break;
      referralCodeValue = newReferralCode();
    }

    const [first] = await tx.select({ id: usersTable.id }).from(usersTable).limit(1);
    const isInitialAdmin = !first;

    let referrerId: string | null = null;
    let secondLevelReferrerId: string | null = null;
    if (referralCode) {
      const [referrer] = await tx
        .select({ id: usersTable.id, referrerId: usersTable.referrerId })
        .from(usersTable)
        .where(eq(usersTable.referralCode, referralCode))
        .limit(1);
      if (referrer) {
        referrerId = referrer.id;
        secondLevelReferrerId = referrer.referrerId;
      }
    }

    const [user] = await tx
      .insert(usersTable)
      .values({
        username,
        keyHash,
        role: isInitialAdmin ? "admin" : "user",
        isInitialAdmin,
        displayName: username,
        registrationIp: publicIp,
        referralCode: referralCodeValue,
        referrerId,
        secondLevelReferrerId,
      })
      .returning();

    await tx.insert(walletBalancesTable).values(
      WALLET_SYMBOLS.map((assetSymbol) => ({
        userId: user.id,
        assetSymbol,
        availableBalance: "0",
        pendingBalance: "0",
        reservedBalance: "0",
      })),
    );

    const token = generateSessionToken();
    await tx.insert(sessionsTable).values({
      userId: user.id,
      tokenHash: hashSessionToken(token),
      status: "active",
      publicIp,
    });

    // Accounts sharing one public IP are allowed. The signal is recorded for the
    // admin console only and is never surfaced to members.
    const [sameIp] = publicIp
      ? await tx
          .select({ total: count() })
          .from(usersTable)
          .where(eq(usersTable.registrationIp, publicIp))
      : [];
    const accountsOnIp = Number(sameIp?.total ?? 1);

    await tx.insert(auditEventsTable).values({
      actorUserId: user.id,
      action: accountsOnIp > 1 ? "account_created_shared_ip" : "account_created",
      targetType: "user",
      targetId: user.id,
      details: {
        username: user.username,
        role: user.role,
        isInitialAdmin,
        publicIp,
        accountsOnIp,
        ...(referrerId ? { referredBy: referralCode } : {}),
      },
    });

    const [balance] = await tx
      .select()
      .from(walletBalancesTable)
      .where(and(eq(walletBalancesTable.userId, user.id), eq(walletBalancesTable.assetSymbol, "BTG")))
      .limit(1);

    return {
      token,
      account: accountDto(user, balance?.availableBalance ?? "0", balance?.pendingBalance ?? "0"),
      status: 201 as const,
    };
  });

  if ("error" in outcome) {
    res.status(outcome.status).json({ error: outcome.error });
    return;
  }
  res.status(201).json({
    token: outcome.token,
    accountKey,
    account: GetAccountResponse.parse(outcome.account),
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const username = bodyString(req.body?.username);
  const key = typeof req.body?.key === "string" ? req.body.key.trim() : "";
  const publicIp = observedPublicIp(req.header("x-forwarded-for"), req.ip);
  if (!username || !key) {
    res.status(400).json({ error: "A username and account key are required." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(sql`lower(${usersTable.username}) = lower(${username})`)
    .limit(1);

  if (!user || !(await verifyAccountKey(key, user.keyHash))) {
    await recordAuthEvent("login_failed", user?.id ?? username, { username, publicIp }, user?.id ?? null);
    res.status(401).json({ error: "The username or account key was not accepted." });
    return;
  }

  if (user.status === "banned") {
    res.status(403).json({ error: "This account is suspended" });
    return;
  }

  const account = await accountWithBalance(user.id);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  const [existing] = await db
    .select({ id: sessionsTable.id })
    .from(sessionsTable)
    .where(and(eq(sessionsTable.userId, user.id), eq(sessionsTable.status, "active")))
    .limit(1);

  if (existing) {
    const pendingToken = generateSessionToken();
    await db.insert(sessionsTable).values({
      userId: user.id,
      tokenHash: hashSessionToken(pendingToken),
      status: "pending",
      publicIp,
    });
    res.status(409).json({
      error: "This account is active on another device",
      code: "DEVICE_SESSION_MISMATCH",
      token: pendingToken,
      account: GetAccountResponse.parse(account),
    });
    return;
  }

  const token = generateSessionToken();
  await db.transaction(async (tx) => {
    await tx.delete(sessionsTable).where(eq(sessionsTable.userId, user.id));
    await tx.insert(sessionsTable).values({
      userId: user.id,
      tokenHash: hashSessionToken(token),
      status: "active",
      publicIp,
    });
  });

  res.json({ token, account: GetAccountResponse.parse(account) });
});

router.post("/auth/logout", requireSignedIn, async (_req, res): Promise<void> => {
  const session = res.locals.session as { id: string };
  await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));
  res.status(204).end();
});

router.post("/auth/key/rotate", requireSignedIn, requireActiveAccount, async (req, res): Promise<void> => {
  const currentKey = typeof req.body?.currentKey === "string" ? req.body.currentKey.trim() : "";
  const requestedKey = typeof req.body?.newKey === "string" ? req.body.newKey.trim() : "";
  const user = res.locals.account;
  const session = res.locals.session as { id: string };

  if (!currentKey) {
    res.status(400).json({ error: "Your current account key is required." });
    return;
  }
  if (requestedKey && !isValidAccountKey(requestedKey)) {
    res.status(400).json({
      error: "The replacement key must be at least 16 characters using letters, numbers, dots, dashes or underscores.",
    });
    return;
  }
  if (!(await verifyAccountKey(currentKey, user.keyHash))) {
    await recordAuthEvent("key_rotation_failed", user.id, { username: user.username });
    res.status(401).json({ error: "The current account key was not accepted." });
    return;
  }

  const nextKey = requestedKey || generateAccountKey();
  const nextHash = await hashAccountKey(nextKey);
  await db
    .update(usersTable)
    .set({ keyHash: nextHash, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id));
  // Rotating a key ends every other device session; the current one stays valid.
  await db
    .delete(sessionsTable)
    .where(and(eq(sessionsTable.userId, user.id), ne(sessionsTable.id, session.id)));
  await recordAuthEvent("account_key_rotated", user.id, { username: user.username });

  res.json({ accountKey: nextKey });
});

export default router;
