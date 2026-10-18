import { db, ledgerEntriesTable, usersTable, walletBalancesTable, walletTransactionsTable } from "@workspace/db";
import {
  ClaimMiningResponse,
  GetAccountResponse,
  GetDashboardResponse,
  GetPlatformStatsResponse,
  GetTeamResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  BASE_HASH_POWER,
  BASE_REWARD,
  COOLDOWN_HOURS,
  L1_RATE,
  L2_RATE,
  MAX_STREAK_BONUS_DAYS,
  REFERRAL_BONUS_PER_REFERRAL,
  STREAK_BONUS_PER_DAY,
  STREAK_RESET_HOURS,
  accountDto,
  amountNumber,
  roundBtg,
  transactionDto,
} from "../lib/bitgold";
import {
  requireActiveAccount,
  requireSignedIn,
} from "../middlewares/bitgoldAuth";

const router: IRouter = Router();

async function accountWithBalance(userId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [balance] = await db
    .select()
    .from(walletBalancesTable)
    .where(and(eq(walletBalancesTable.userId, userId), eq(walletBalancesTable.assetSymbol, "BTG")))
    .limit(1);
  if (!user) return null;
  return accountDto(user, balance?.availableBalance ?? "0", balance?.pendingBalance ?? "0");
}


router.get("/account", requireSignedIn, requireActiveAccount, async (_req, res): Promise<void> => {
  const user = res.locals.account;
  const account = await accountWithBalance(user.id);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json(GetAccountResponse.parse(account));
});


router.patch("/profile", requireSignedIn, requireActiveAccount, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const patch: { displayName?: string; country?: string } = {};
  if (parsed.data.displayName !== undefined) patch.displayName = parsed.data.displayName.trim().slice(0, 80);
  if (parsed.data.country !== undefined) patch.country = parsed.data.country.trim().slice(0, 80);
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  const user = res.locals.account;
  const [updated] = await db
    .update(usersTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id))
    .returning();
  const account = await accountWithBalance(updated.id);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json(UpdateProfileResponse.parse(account));
});

async function getPlatformStats() {
  const [users] = await db.select({ total: count() }).from(usersTable);
  const [mining] = await db.select({
    totalMined: sql<string>`coalesce(sum(${usersTable.totalMined}), 0)`,
    totalClaims: sql<number>`coalesce(sum(${usersTable.totalClaims}), 0)`,
    activeMiners: sql<number>`count(*) filter (where ${usersTable.lastClaimAt} >= now() - interval '24 hours')`,
  }).from(usersTable);
  return {
    totalUsers: Number(users.total),
    totalMined: amountNumber(mining.totalMined),
    activeMiners: Number(mining.activeMiners),
    totalClaims: Number(mining.totalClaims),
  };
}

router.get("/platform/stats", async (_req, res): Promise<void> => {
  res.json(GetPlatformStatsResponse.parse(await getPlatformStats()));
});

router.get("/dashboard", requireSignedIn, requireActiveAccount, async (_req, res): Promise<void> => {
  const user = res.locals.account;
  const [account, recent] = await Promise.all([
    accountWithBalance(user.id),
    db
      .select()
      .from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.userId, user.id))
      .orderBy(desc(walletTransactionsTable.createdAt))
      .limit(8),
  ]);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json(
    GetDashboardResponse.parse({
      account,
      stats: await getPlatformStats(),
      recentTransactions: recent.map((transaction) => transactionDto(transaction, user.username)),
    }),
  );
});

router.post("/mining/claim", requireSignedIn, requireActiveAccount, async (_req, res): Promise<void> => {
  const user = res.locals.account;
  const now = new Date();
  const result = await db.transaction(async (tx) => {
    const [lockedUser] = await tx
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1)
      .for("update");
    if (!lockedUser) return { error: "Account not found", status: 404 as const };
    if (lockedUser.lastClaimAt) {
      const nextAllowed = new Date(lockedUser.lastClaimAt.getTime() + COOLDOWN_HOURS * 3_600_000);
      if (now < nextAllowed) {
        return { error: "Mining reward is cooling down", status: 409 as const };
      }
    }

    const elapsedHours = lockedUser.lastClaimAt
      ? (now.getTime() - lockedUser.lastClaimAt.getTime()) / 3_600_000
      : Number.POSITIVE_INFINITY;
    const streak = lockedUser.lastClaimAt && elapsedHours < STREAK_RESET_HOURS
      ? lockedUser.streak + 1
      : 1;
    const [referralCount] = await tx
      .select({ total: count() })
      .from(usersTable)
      .where(eq(usersTable.referrerId, lockedUser.id));
    const referralBonusCount = Number(referralCount.total);
    const reward = roundBtg(
      BASE_REWARD
      + Math.min(Math.max(streak, 0), MAX_STREAK_BONUS_DAYS) * STREAK_BONUS_PER_DAY
      + Math.max(referralBonusCount, 0) * REFERRAL_BONUS_PER_REFERRAL,
    );
    const hashPower = BASE_HASH_POWER + streak * 5 + referralBonusCount * 3;
    const [transaction] = await tx.insert(walletTransactionsTable).values({
      userId: lockedUser.id,
      type: "mining",
      assetSymbol: "BTG",
      amount: String(reward),
      status: "completed",
      description: `Daily mining claim (Day ${streak})`,
    }).returning();

    const [balance] = await tx
      .select()
      .from(walletBalancesTable)
      .where(and(eq(walletBalancesTable.userId, lockedUser.id), eq(walletBalancesTable.assetSymbol, "BTG")))
      .limit(1)
      .for("update");
    const newBalance = roundBtg(amountNumber(balance?.availableBalance) + reward);
    await tx
      .update(walletBalancesTable)
      .set({ availableBalance: String(newBalance), updatedAt: now })
      .where(and(eq(walletBalancesTable.userId, lockedUser.id), eq(walletBalancesTable.assetSymbol, "BTG")));
    await tx.insert(ledgerEntriesTable).values({
      transactionId: transaction.id,
      userId: lockedUser.id,
      assetSymbol: "BTG",
      availableDelta: String(reward),
      reason: "daily_mining_claim",
    });
    await tx.update(usersTable).set({
      streak,
      lastClaimAt: now,
      totalMined: String(roundBtg(amountNumber(lockedUser.totalMined) + reward)),
      totalClaims: lockedUser.totalClaims + 1,
      hashPower: String(hashPower),
      updatedAt: now,
    }).where(eq(usersTable.id, lockedUser.id));

    if (lockedUser.referrerId) {
      const [l1] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, lockedUser.referrerId))
        .limit(1)
        .for("update");
      if (l1) {
        const l1Bonus = roundBtg(reward * L1_RATE);
        const [l1Transaction] = await tx.insert(walletTransactionsTable).values({
          userId: l1.id,
          type: "referral",
          assetSymbol: "BTG",
          amount: String(l1Bonus),
          status: "completed",
          description: `10% referral bonus from ${lockedUser.username}`,
        }).returning();
        await tx.update(walletBalancesTable).set({
          availableBalance: sql`${walletBalancesTable.availableBalance} + ${String(l1Bonus)}`,
          updatedAt: now,
        }).where(and(eq(walletBalancesTable.userId, l1.id), eq(walletBalancesTable.assetSymbol, "BTG")));
        await tx.insert(ledgerEntriesTable).values({
          transactionId: l1Transaction.id,
          userId: l1.id,
          assetSymbol: "BTG",
          availableDelta: String(l1Bonus),
          reason: "level_1_referral_reward",
        });
        await tx.update(usersTable).set({
          totalReferralEarnings: sql`${usersTable.totalReferralEarnings} + ${String(l1Bonus)}`,
          updatedAt: now,
        }).where(eq(usersTable.id, l1.id));
      }
    }
    if (lockedUser.secondLevelReferrerId) {
      const [l2] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, lockedUser.secondLevelReferrerId))
        .limit(1)
        .for("update");
      if (l2) {
        const l2Bonus = roundBtg(reward * L2_RATE);
        const [l2Transaction] = await tx.insert(walletTransactionsTable).values({
          userId: l2.id,
          type: "referral",
          assetSymbol: "BTG",
          amount: String(l2Bonus),
          status: "completed",
          description: `5% referral bonus from ${lockedUser.username}`,
        }).returning();
        await tx.update(walletBalancesTable).set({
          availableBalance: sql`${walletBalancesTable.availableBalance} + ${String(l2Bonus)}`,
          updatedAt: now,
        }).where(and(eq(walletBalancesTable.userId, l2.id), eq(walletBalancesTable.assetSymbol, "BTG")));
        await tx.insert(ledgerEntriesTable).values({
          transactionId: l2Transaction.id,
          userId: l2.id,
          assetSymbol: "BTG",
          availableDelta: String(l2Bonus),
          reason: "level_2_referral_reward",
        });
        await tx.update(usersTable).set({
          totalReferralEarnings: sql`${usersTable.totalReferralEarnings} + ${String(l2Bonus)}`,
          updatedAt: now,
        }).where(eq(usersTable.id, l2.id));
      }
    }

    return {
      amount: reward,
      balance: newBalance,
      nextClaimAt: new Date(now.getTime() + COOLDOWN_HOURS * 3_600_000).toISOString(),
      status: 200 as const,
    };
  });
  if ("error" in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(ClaimMiningResponse.parse(result));
});

router.get("/team", requireSignedIn, requireActiveAccount, async (_req, res): Promise<void> => {
  const user = res.locals.account;
  const [l1, l2] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.referrerId, user.id)).orderBy(desc(usersTable.createdAt)),
    db.select().from(usersTable).where(eq(usersTable.secondLevelReferrerId, user.id)).orderBy(desc(usersTable.createdAt)),
  ]);
  const [earnings] = await db.select({
    total: sql<string>`coalesce(sum(${walletTransactionsTable.amount}), 0)`,
  }).from(walletTransactionsTable).where(and(
    eq(walletTransactionsTable.userId, user.id),
    eq(walletTransactionsTable.type, "referral"),
    eq(walletTransactionsTable.status, "completed"),
  ));
  res.json(
    GetTeamResponse.parse({
      referralCode: user.referralCode,
      level1Count: l1.length,
      level2Count: l2.length,
      totalReferralEarnings: amountNumber(earnings.total),
      level1: l1.map((member) => ({
        username: member.username,
        joinedAt: member.createdAt.toISOString(),
        totalEarned: amountNumber(member.totalMined),
        level: 1,
      })),
      level2: l2.map((member) => ({
        username: member.username,
        joinedAt: member.createdAt.toISOString(),
        totalEarned: amountNumber(member.totalMined),
        level: 2,
      })),
    }),
  );
});

export default router;
