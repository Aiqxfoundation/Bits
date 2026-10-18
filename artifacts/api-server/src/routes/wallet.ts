import { db, ledgerEntriesTable, walletBalancesTable, walletTransactionsTable } from "@workspace/db";
import {
  GetWalletResponse,
  RequestDepositBody,
  RequestDepositResponse,
  RequestWithdrawalBody,
  RequestWithdrawalResponse,
} from "@workspace/api-zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ASSET_SYMBOLS,
  amountNumber,
  transactionDto,
} from "../lib/bitgold";
import {
  requireActiveAccount,
  requireSignedIn,
} from "../middlewares/bitgoldAuth";

const router: IRouter = Router();

router.get("/wallet", requireSignedIn, requireActiveAccount, async (_req, res): Promise<void> => {
  const user = res.locals.account;
  const [balances, transactions] = await Promise.all([
    db.select().from(walletBalancesTable).where(eq(walletBalancesTable.userId, user.id)),
    db
      .select()
      .from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.userId, user.id))
      .orderBy(desc(walletTransactionsTable.createdAt))
      .limit(50),
  ]);
  const bySymbol = new Map(balances.map((row) => [row.assetSymbol, row]));
  const assets = [
    { symbol: "BTG", name: "Bitgold", priceUsd: 1, change24h: 0 },
    { symbol: "BTC", name: "Bitcoin", priceUsd: 0, change24h: 0 },
    { symbol: "USDT", name: "Tether", priceUsd: 1, change24h: 0 },
  ].map((metadata) => {
    const balance = bySymbol.get(metadata.symbol);
    return {
      ...metadata,
      balance: amountNumber(balance?.availableBalance) + amountNumber(balance?.reservedBalance),
      availableBalance: amountNumber(balance?.availableBalance),
      pendingBalance: amountNumber(balance?.pendingBalance) + amountNumber(balance?.reservedBalance),
    };
  });
  const btg = bySymbol.get("BTG");
  res.json(
    GetWalletResponse.parse({
      assets,
      transactions: transactions.map((transaction) => transactionDto(transaction, user.username)),
      availableBalance: amountNumber(btg?.availableBalance),
      pendingBalance: amountNumber(btg?.pendingBalance) + amountNumber(btg?.reservedBalance),
    }),
  );
});

router.post(
  "/wallet/deposits",
  requireSignedIn,
  requireActiveAccount,
  async (req, res): Promise<void> => {
    const parsed = RequestDepositBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const user = res.locals.account;
    const assetSymbol = parsed.data.assetSymbol.toUpperCase();
    const amount = parsed.data.amount;
    if (!ASSET_SYMBOLS.includes(assetSymbol as (typeof ASSET_SYMBOLS)[number])) {
      res.status(400).json({ error: "Unsupported asset" });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 1e8) / 1e8 !== amount) {
      res.status(400).json({ error: "Enter a valid amount (up to 8 decimal places)" });
      return;
    }

    const created = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(walletTransactionsTable)
        .where(and(
          eq(walletTransactionsTable.userId, user.id),
          eq(walletTransactionsTable.idempotencyKey, parsed.data.idempotencyKey),
        ))
        .limit(1);
      if (existing) {
        if (
          existing.type !== "deposit"
          || existing.assetSymbol !== assetSymbol
          || amountNumber(existing.amount) !== amount
          || (existing.transactionHash ?? "") !== (parsed.data.transactionHash?.trim() || "")
        ) {
          return { error: "This idempotency key was already used for a different request" as const };
        }
        return { transaction: existing };
      }
      await tx
        .insert(walletBalancesTable)
        .values({ userId: user.id, assetSymbol, availableBalance: "0", pendingBalance: "0", reservedBalance: "0" })
        .onConflictDoNothing();
      const [transaction] = await tx
        .insert(walletTransactionsTable)
        .values({
          userId: user.id,
          type: "deposit",
          assetSymbol,
          amount: String(amount),
          status: "pending",
          transactionHash: parsed.data.transactionHash?.trim() || null,
          idempotencyKey: parsed.data.idempotencyKey,
          description: "Deposit submitted for admin confirmation",
        })
        .onConflictDoNothing()
        .returning();
      if (!transaction) {
        const [racedDuplicate] = await tx.select().from(walletTransactionsTable)
          .where(and(
            eq(walletTransactionsTable.userId, user.id),
            eq(walletTransactionsTable.idempotencyKey, parsed.data.idempotencyKey),
          ))
          .limit(1);
        if (!racedDuplicate) throw new Error("Unable to persist deposit request");
        return { transaction: racedDuplicate };
      }
      await tx
        .update(walletBalancesTable)
        .set({
          pendingBalance: sql`${walletBalancesTable.pendingBalance} + ${String(amount)}`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(walletBalancesTable.userId, user.id),
          eq(walletBalancesTable.assetSymbol, assetSymbol),
        ));
      await tx.insert(ledgerEntriesTable).values({
        transactionId: transaction.id,
        userId: user.id,
        assetSymbol,
        pendingDelta: String(amount),
        reason: "deposit_submitted",
      });
      return { transaction };
    });
    if ("error" in created) {
      res.status(409).json({ error: created.error });
      return;
    }
    res.status(201).json(RequestDepositResponse.parse(transactionDto(created.transaction, user.username)));
  },
);

router.post(
  "/wallet/withdrawals",
  requireSignedIn,
  requireActiveAccount,
  async (req, res): Promise<void> => {
    const parsed = RequestWithdrawalBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const user = res.locals.account;
    const assetSymbol = parsed.data.assetSymbol.toUpperCase();
    const amount = parsed.data.amount;
    if (!ASSET_SYMBOLS.includes(assetSymbol as (typeof ASSET_SYMBOLS)[number])) {
      res.status(400).json({ error: "Unsupported asset" });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 1e8) / 1e8 !== amount) {
      res.status(400).json({ error: "Enter a valid amount (up to 8 decimal places)" });
      return;
    }
    if (!parsed.data.walletAddress.trim()) {
      res.status(400).json({ error: "A destination address is required" });
      return;
    }

    const outcome = await db.transaction(async (tx) => {
      const [duplicate] = await tx
        .select()
        .from(walletTransactionsTable)
        .where(and(
          eq(walletTransactionsTable.userId, user.id),
          eq(walletTransactionsTable.idempotencyKey, parsed.data.idempotencyKey),
        ))
        .limit(1);
      if (duplicate) return { transaction: duplicate };
      if (
        duplicate.type !== "withdrawal"
        || duplicate.assetSymbol !== assetSymbol
        || amountNumber(duplicate.amount) !== -amount
        || duplicate.walletAddress !== parsed.data.walletAddress.trim()
      ) {
        return { error: "This idempotency key was already used for a different request" };
      }

      await tx
        .insert(walletBalancesTable)
        .values({ userId: user.id, assetSymbol, availableBalance: "0", pendingBalance: "0", reservedBalance: "0" })
        .onConflictDoNothing();
      const [balance] = await tx
        .select()
        .from(walletBalancesTable)
        .where(and(
          eq(walletBalancesTable.userId, user.id),
          eq(walletBalancesTable.assetSymbol, assetSymbol),
        ))
        .limit(1)
        .for("update");
      const availableBalance = amountNumber(balance?.availableBalance);
      if (!balance || availableBalance < amount) {
        return { error: "Insufficient available balance" };
      }

      const [transaction] = await tx
        .insert(walletTransactionsTable)
        .values({
          userId: user.id,
          type: "withdrawal",
          assetSymbol,
          amount: String(-amount),
          status: "pending",
          description: "Withdrawal awaiting admin review",
          walletAddress: parsed.data.walletAddress.trim(),
          network: parsed.data.network?.trim() || "BTG Mainnet",
          idempotencyKey: parsed.data.idempotencyKey,
        })
        .returning();
      await tx
        .update(walletBalancesTable)
        .set({
          availableBalance: String(availableBalance - amount),
          reservedBalance: `${amountNumber(balance.reservedBalance) + amount}`,
          updatedAt: new Date(),
        })
        .where(eq(walletBalancesTable.id, balance.id));
      await tx.insert(ledgerEntriesTable).values({
        transactionId: transaction.id,
        userId: user.id,
        assetSymbol,
        availableDelta: String(-amount),
        reservedDelta: String(amount),
        reason: "withdrawal_reserved",
      });
      return { transaction };
    });

    if ("error" in outcome) {
      res.status(409).json({ error: outcome.error });
      return;
    }
    res.status(201).json(
      RequestWithdrawalResponse.parse(transactionDto(outcome.transaction, user.username)),
    );
  },
);

export default router;
