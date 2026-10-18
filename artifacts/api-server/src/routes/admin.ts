import { db, auditEventsTable, ledgerEntriesTable, usersTable, walletBalancesTable, walletTransactionsTable } from "@workspace/db";
import {
  DecideDepositBody,
  DecideDepositParams,
  DecideDepositResponse,
  DecideWithdrawalBody,
  DecideWithdrawalParams,
  DecideWithdrawalResponse,
  GetAdminAuditQueryParams,
  GetAdminAuditResponse,
  GetAdminDepositsQueryParams,
  GetAdminDepositsResponse,
  GetAdminIpClustersResponse,
  GetAdminOverviewResponse,
  GetAdminUserParams,
  GetAdminUserResponse,
  GetAdminUsersQueryParams,
  GetAdminUsersResponse,
  GetAdminWithdrawalsQueryParams,
  GetAdminWithdrawalsResponse,
  UpdateAdminUserBody,
  UpdateAdminUserParams,
  UpdateAdminUserResponse,
} from "@workspace/api-zod";
import { and, count, desc, eq, gt, ilike, isNotNull, max, min, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { amountNumber, transactionDto } from "../lib/bitgold";
import {
  requireActiveAccount,
  requireAdministrator,
  requireSignedIn,
} from "../middlewares/bitgoldAuth";

const router: IRouter = Router();
router.use(requireSignedIn, requireActiveAccount, requireAdministrator);

function adminUserDto(user: typeof usersTable.$inferSelect, balance: string | number) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
    balance: amountNumber(balance),
    joinedAt: user.createdAt.toISOString(),
    isInitialAdmin: user.isInitialAdmin,
  };
}

async function transactionPage(type: "deposit" | "withdrawal", status: string | undefined, limit: number, offset: number) {
  const whereClause = status && status !== "all"
    ? and(eq(walletTransactionsTable.type, type), eq(walletTransactionsTable.status, status as "pending"))
    : eq(walletTransactionsTable.type, type);
  const [items, total] = await Promise.all([
    db
      .select({ transaction: walletTransactionsTable, username: usersTable.username })
      .from(walletTransactionsTable)
      .innerJoin(usersTable, eq(walletTransactionsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(walletTransactionsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(walletTransactionsTable).where(whereClause),
  ]);
  return {
    items: items.map((row) => transactionDto(row.transaction, row.username)),
    total: Number(total[0]?.total ?? 0),
  };
}

router.get("/admin/overview", async (_req, res): Promise<void> => {
  const [counts, funds, pendingDeposits, pendingWithdrawals, sharedIpGroups] = await Promise.all([
    db.select({
      total: count(),
      active: sql<number>`count(*) filter (where ${usersTable.status} = 'active')`,
      banned: sql<number>`count(*) filter (where ${usersTable.status} = 'banned')`,
    }).from(usersTable),
    db.select({
      total: sql<string>`coalesce(sum(${walletBalancesTable.availableBalance} + ${walletBalancesTable.pendingBalance} + ${walletBalancesTable.reservedBalance}), 0)`,
    }).from(walletBalancesTable),
    db.select({ total: count() }).from(walletTransactionsTable)
      .where(and(eq(walletTransactionsTable.type, "deposit"), eq(walletTransactionsTable.status, "pending"))),
    db.select({ total: count() }).from(walletTransactionsTable)
      .where(and(eq(walletTransactionsTable.type, "withdrawal"), eq(walletTransactionsTable.status, "pending"))),
    db.select({ ip: usersTable.registrationIp }).from(usersTable)
      .where(isNotNull(usersTable.registrationIp))
      .groupBy(usersTable.registrationIp)
      .having(gt(count(), 1)),
  ]);
  res.json(GetAdminOverviewResponse.parse({
    totalUsers: Number(counts[0]?.total ?? 0),
    activeUsers: Number(counts[0]?.active ?? 0),
    bannedUsers: Number(counts[0]?.banned ?? 0),
    pendingDeposits: Number(pendingDeposits[0]?.total ?? 0),
    pendingWithdrawals: Number(pendingWithdrawals[0]?.total ?? 0),
    sharedIpGroups: sharedIpGroups.length,
    totalBalance: amountNumber(funds[0]?.total),
  }));
});

router.get("/admin/users", async (req, res): Promise<void> => {
  const parsed = GetAdminUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const status = parsed.data.status ?? "all";
  const search = parsed.data.search?.trim();
  const limit = parsed.data.limit ?? 50;
  const offset = parsed.data.offset ?? 0;
  const conditions = [];
  if (status === "active" || status === "banned") conditions.push(eq(usersTable.status, status));
  if (search) conditions.push(ilike(usersTable.username, `%${search}%`));
  const whereClause = conditions.length ? and(...conditions) : undefined;
  const [users, total] = await Promise.all([
    db
      .select({ user: usersTable, balance: walletBalancesTable.availableBalance })
      .from(usersTable)
      .leftJoin(walletBalancesTable, and(
        eq(walletBalancesTable.userId, usersTable.id),
        eq(walletBalancesTable.assetSymbol, "BTG"),
      ))
      .where(whereClause)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(usersTable).where(whereClause),
  ]);
  res.json(GetAdminUsersResponse.parse({
    items: users.map(({ user, balance }) => adminUserDto(user, balance ?? "0")),
    total: Number(total[0]?.total ?? 0),
  }));
});

router.get("/admin/users/:userId", async (req, res): Promise<void> => {
  const params = GetAdminUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, params.data.userId))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [balances, transactions] = await Promise.all([
    db.select().from(walletBalancesTable).where(eq(walletBalancesTable.userId, user.id)),
    db.select().from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.userId, user.id))
      .orderBy(desc(walletTransactionsTable.createdAt))
      .limit(50),
  ]);
  const balanceMap = new Map(balances.map((balance) => [balance.assetSymbol, balance]));
  res.json(GetAdminUserResponse.parse({
    user: adminUserDto(user, balanceMap.get("BTG")?.availableBalance ?? "0"),
    walletBalances: [
      { symbol: "BTG", name: "Bitgold" },
      { symbol: "BTC", name: "Bitcoin" },
      { symbol: "USDT", name: "Tether" },
    ].map((asset) => {
      const balance = balanceMap.get(asset.symbol);
      return {
        ...asset,
        balance: amountNumber(balance?.availableBalance) + amountNumber(balance?.reservedBalance),
        availableBalance: amountNumber(balance?.availableBalance),
        pendingBalance: amountNumber(balance?.pendingBalance) + amountNumber(balance?.reservedBalance),
        priceUsd: asset.symbol === "BTC" ? 0 : 1,
        change24h: 0,
      };
    }),
    transactions: transactions.map((transaction) => transactionDto(transaction, user.username)),
  }));
});

router.patch("/admin/users/:userId", async (req, res): Promise<void> => {
  const params = UpdateAdminUserParams.safeParse(req.params);
  const parsed = UpdateAdminUserBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.error?.message ?? parsed.error?.message });
    return;
  }
  const actor = res.locals.account;
  const outcome = await db.transaction(async (tx) => {
    const [target] = await tx.select().from(usersTable)
      .where(eq(usersTable.id, params.data.userId)).limit(1).for("update");
    if (!target) return { error: "User not found", status: 404 as const };
    if (target.isInitialAdmin || target.id === actor.id) {
      return { error: "The initial administrator cannot be banned or changed", status: 409 as const };
    }
    const [updated] = await tx.update(usersTable)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(usersTable.id, target.id))
      .returning();
    await tx.insert(auditEventsTable).values({
      actorUserId: actor.id,
      action: parsed.data.status === "banned" ? "user_banned" : "user_unbanned",
      targetType: "user",
      targetId: target.id,
      details: { username: target.username },
    });
    const [balance] = await tx.select().from(walletBalancesTable)
      .where(and(eq(walletBalancesTable.userId, target.id), eq(walletBalancesTable.assetSymbol, "BTG")))
      .limit(1);
    return { user: updated, balance: balance?.availableBalance ?? "0", status: 200 as const };
  });
  if ("error" in outcome) {
    res.status(outcome.status).json({ error: outcome.error });
    return;
  }
  res.json(UpdateAdminUserResponse.parse(adminUserDto(outcome.user, outcome.balance)));
});

router.get("/admin/deposits", async (req, res): Promise<void> => {
  const parsed = GetAdminDepositsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = await transactionPage("deposit", parsed.data.status, parsed.data.limit ?? 50, parsed.data.offset ?? 0);
  res.json(GetAdminDepositsResponse.parse(result));
});

router.post("/admin/deposits/:depositId/decision", async (req, res): Promise<void> => {
  const params = DecideDepositParams.safeParse(req.params);
  const parsed = DecideDepositBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.error?.message ?? parsed.error?.message });
    return;
  }
  const actor = res.locals.account;
  const result = await db.transaction(async (tx) => {
    const [transaction] = await tx.select().from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.id, params.data.depositId)).limit(1).for("update");
    if (!transaction || transaction.type !== "deposit") return { error: "Deposit not found", status: 404 as const };
    if (transaction.status !== "pending") return { error: "Deposit has already been decided", status: 409 as const };
    const amount = amountNumber(transaction.amount);
    const now = new Date();
    const [updated] = await tx.update(walletTransactionsTable).set({
      status: parsed.data.decision,
      adminNote: parsed.data.note?.trim() || null,
      decidedByUserId: actor.id,
      decidedAt: now,
    }).where(and(
      eq(walletTransactionsTable.id, transaction.id),
      eq(walletTransactionsTable.status, "pending"),
    )).returning();
    if (!updated) return { error: "Deposit has already been decided", status: 409 as const };
    await tx.update(walletBalancesTable).set({
      availableBalance: parsed.data.decision === "confirmed"
        ? sql`${walletBalancesTable.availableBalance} + ${String(amount)}`
        : walletBalancesTable.availableBalance,
      pendingBalance: sql`greatest(${walletBalancesTable.pendingBalance} - ${String(amount)}, 0)`,
      updatedAt: now,
    }).where(and(
      eq(walletBalancesTable.userId, transaction.userId),
      eq(walletBalancesTable.assetSymbol, transaction.assetSymbol),
    ));
    await tx.insert(ledgerEntriesTable).values({
      transactionId: transaction.id,
      userId: transaction.userId,
      assetSymbol: transaction.assetSymbol,
      availableDelta: parsed.data.decision === "confirmed" ? String(amount) : "0",
      pendingDelta: String(-amount),
      reason: parsed.data.decision === "confirmed" ? "deposit_confirmed" : "deposit_rejected",
    });
    await tx.insert(auditEventsTable).values({
      actorUserId: actor.id,
      action: `deposit_${parsed.data.decision}`,
      targetType: "wallet_transaction",
      targetId: transaction.id,
      details: { userId: transaction.userId, amount, assetSymbol: transaction.assetSymbol },
    });
    const [owner] = await tx.select({ username: usersTable.username }).from(usersTable)
      .where(eq(usersTable.id, transaction.userId)).limit(1);
    return { transaction: updated, username: owner?.username ?? null };
  });
  if ("error" in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(DecideDepositResponse.parse(transactionDto(result.transaction, result.username)));
});

router.get("/admin/withdrawals", async (req, res): Promise<void> => {
  const parsed = GetAdminWithdrawalsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = await transactionPage("withdrawal", parsed.data.status, parsed.data.limit ?? 50, parsed.data.offset ?? 0);
  res.json(GetAdminWithdrawalsResponse.parse(result));
});

router.post("/admin/withdrawals/:withdrawalId/decision", async (req, res): Promise<void> => {
  const params = DecideWithdrawalParams.safeParse(req.params);
  const parsed = DecideWithdrawalBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.error?.message ?? parsed.error?.message });
    return;
  }
  const actor = res.locals.account;
  const result = await db.transaction(async (tx) => {
    const [transaction] = await tx.select().from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.id, params.data.withdrawalId)).limit(1).for("update");
    if (!transaction || transaction.type !== "withdrawal") return { error: "Withdrawal not found", status: 404 as const };
    if (transaction.status !== "pending") return { error: "Withdrawal has already been decided", status: 409 as const };
    const amount = Math.abs(amountNumber(transaction.amount));
    const now = new Date();
    const [updated] = await tx.update(walletTransactionsTable).set({
      status: parsed.data.decision,
      transactionHash: parsed.data.transactionHash?.trim() || transaction.transactionHash,
      adminNote: parsed.data.note?.trim() || null,
      decidedByUserId: actor.id,
      decidedAt: now,
    }).where(and(
      eq(walletTransactionsTable.id, transaction.id),
      eq(walletTransactionsTable.status, "pending"),
    )).returning();
    if (!updated) return { error: "Withdrawal has already been decided", status: 409 as const };
    await tx.update(walletBalancesTable).set({
      availableBalance: parsed.data.decision === "rejected"
        ? sql`${walletBalancesTable.availableBalance} + ${String(amount)}`
        : walletBalancesTable.availableBalance,
      reservedBalance: sql`greatest(${walletBalancesTable.reservedBalance} - ${String(amount)}, 0)`,
      updatedAt: now,
    }).where(and(
      eq(walletBalancesTable.userId, transaction.userId),
      eq(walletBalancesTable.assetSymbol, transaction.assetSymbol),
    ));
    await tx.insert(ledgerEntriesTable).values({
      transactionId: transaction.id,
      userId: transaction.userId,
      assetSymbol: transaction.assetSymbol,
      availableDelta: parsed.data.decision === "rejected" ? String(amount) : "0",
      reservedDelta: String(-amount),
      reason: parsed.data.decision === "rejected" ? "withdrawal_rejected_refund" : "withdrawal_approved",
    });
    await tx.insert(auditEventsTable).values({
      actorUserId: actor.id,
      action: `withdrawal_${parsed.data.decision}`,
      targetType: "wallet_transaction",
      targetId: transaction.id,
      details: { userId: transaction.userId, amount, assetSymbol: transaction.assetSymbol },
    });
    const [owner] = await tx.select({ username: usersTable.username }).from(usersTable)
      .where(eq(usersTable.id, transaction.userId)).limit(1);
    return { transaction: updated, username: owner?.username ?? null };
  });
  if ("error" in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(DecideWithdrawalResponse.parse(transactionDto(result.transaction, result.username)));
});

router.get("/admin/ip-clusters", async (_req, res): Promise<void> => {
  const groups = await db.select({
    publicIp: usersTable.registrationIp,
    firstSeen: min(usersTable.createdAt),
    lastSeen: max(usersTable.createdAt),
    accountCount: count(),
  }).from(usersTable)
    .where(isNotNull(usersTable.registrationIp))
    .groupBy(usersTable.registrationIp)
    .having(gt(count(), 1));

  const items = await Promise.all(groups.map(async (group) => {
    if (!group.publicIp) return null;
    const members = await db.select({
      user: usersTable,
      balance: walletBalancesTable.availableBalance,
    }).from(usersTable)
      .leftJoin(walletBalancesTable, and(
        eq(walletBalancesTable.userId, usersTable.id),
        eq(walletBalancesTable.assetSymbol, "BTG"),
      ))
      .where(eq(usersTable.registrationIp, group.publicIp))
      .orderBy(desc(usersTable.createdAt));
    return {
      publicIp: group.publicIp,
      accountCount: Number(group.accountCount),
      accounts: members.map(({ user, balance }) => adminUserDto(user, balance ?? "0")),
      firstSeenAt: group.firstSeen?.toISOString() ?? new Date(0).toISOString(),
      lastSeenAt: group.lastSeen?.toISOString() ?? new Date(0).toISOString(),
    };
  }));
  res.json(GetAdminIpClustersResponse.parse({ items: items.filter(Boolean) }));
});

router.get("/admin/audit", async (req, res): Promise<void> => {
  const parsed = GetAdminAuditQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const limit = parsed.data.limit ?? 50;
  const offset = parsed.data.offset ?? 0;
  const [events, total] = await Promise.all([
    db.select({ event: auditEventsTable, actorUsername: usersTable.username })
      .from(auditEventsTable)
      .leftJoin(usersTable, eq(auditEventsTable.actorUserId, usersTable.id))
      .orderBy(desc(auditEventsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(auditEventsTable),
  ]);
  res.json(GetAdminAuditResponse.parse({
    items: events.map(({ event, actorUsername }) => ({
      id: event.id,
      actorUsername: actorUsername ?? "System",
      action: event.action,
      target: `${event.targetType}:${event.targetId}`,
      details: event.details ? JSON.stringify(event.details) : null,
      createdAt: event.createdAt.toISOString(),
    })),
    total: Number(total[0]?.total ?? 0),
  }));
});

export default router;
