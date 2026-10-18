import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const accountRoleEnum = pgEnum("bitgold_account_role", ["admin", "user"]);
export const accountStatusEnum = pgEnum("bitgold_account_status", ["active", "banned"]);
export const sessionStatusEnum = pgEnum("bitgold_session_status", ["active", "pending"]);
export const transactionTypeEnum = pgEnum("bitgold_transaction_type", [
  "deposit",
  "withdrawal",
  "mining",
  "referral",
  "transfer",
]);
export const transactionStatusEnum = pgEnum("bitgold_transaction_status", [
  "pending",
  "confirmed",
  "rejected",
  "approved",
  "completed",
]);

export const usersTable = pgTable(
  "bitgold_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    keyHash: text("key_hash").notNull(),
    role: accountRoleEnum("role").notNull().default("user"),
    status: accountStatusEnum("status").notNull().default("active"),
    isInitialAdmin: boolean("is_initial_admin").notNull().default(false),
    displayName: text("display_name"),
    country: text("country"),
    registrationIp: text("registration_ip"),
    referralCode: text("referral_code").notNull().unique(),
    referrerId: uuid("referrer_id").references(
      (): AnyPgColumn => usersTable.id,
      { onDelete: "set null" },
    ),
    secondLevelReferrerId: uuid("second_level_referrer_id").references(
      (): AnyPgColumn => usersTable.id,
      { onDelete: "set null" },
    ),
    streak: integer("streak").notNull().default(0),
    lastClaimAt: timestamp("last_claim_at", { withTimezone: true }),
    totalMined: numeric("total_mined", { precision: 24, scale: 8 }).notNull().default("0"),
    totalReferralEarnings: numeric("total_referral_earnings", { precision: 24, scale: 8 }).notNull().default("0"),
    totalClaims: integer("total_claims").notNull().default(0),
    hashPower: numeric("hash_power", { precision: 16, scale: 4 }).notNull().default("100"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("bitgold_users_referrer_idx").on(table.referrerId),
    index("bitgold_users_second_referrer_idx").on(table.secondLevelReferrerId),
    index("bitgold_users_registration_ip_idx").on(table.registrationIp),
  ],
);

export const sessionsTable = pgTable(
  "bitgold_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    status: sessionStatusEnum("status").notNull().default("active"),
    publicIp: text("public_ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("bitgold_sessions_user_idx").on(table.userId)],
);

export const walletBalancesTable = pgTable(
  "bitgold_wallet_balances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    assetSymbol: text("asset_symbol").notNull(),
    availableBalance: numeric("available_balance", { precision: 24, scale: 8 }).notNull().default("0"),
    pendingBalance: numeric("pending_balance", { precision: 24, scale: 8 }).notNull().default("0"),
    reservedBalance: numeric("reserved_balance", { precision: 24, scale: 8 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("bitgold_wallet_balances_user_asset_unique").on(table.userId, table.assetSymbol),
  ],
);

export const walletTransactionsTable = pgTable(
  "bitgold_wallet_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    type: transactionTypeEnum("type").notNull(),
    assetSymbol: text("asset_symbol").notNull(),
    amount: numeric("amount", { precision: 24, scale: 8 }).notNull(),
    status: transactionStatusEnum("status").notNull().default("pending"),
    description: text("description").notNull(),
    walletAddress: text("wallet_address"),
    network: text("network"),
    transactionHash: text("transaction_hash"),
    adminNote: text("admin_note"),
    idempotencyKey: text("idempotency_key"),
    decidedByUserId: uuid("decided_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (table) => [
    index("bitgold_wallet_transactions_user_created_idx").on(table.userId, table.createdAt),
    index("bitgold_wallet_transactions_type_status_idx").on(table.type, table.status),
    uniqueIndex("bitgold_wallet_transactions_user_idempotency_unique").on(
      table.userId,
      table.idempotencyKey,
    ),
  ],
);

export const ledgerEntriesTable = pgTable(
  "bitgold_ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => walletTransactionsTable.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    assetSymbol: text("asset_symbol").notNull(),
    availableDelta: numeric("available_delta", { precision: 24, scale: 8 }).notNull().default("0"),
    pendingDelta: numeric("pending_delta", { precision: 24, scale: 8 }).notNull().default("0"),
    reservedDelta: numeric("reserved_delta", { precision: 24, scale: 8 }).notNull().default("0"),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("bitgold_ledger_entries_user_created_idx").on(table.userId, table.createdAt),
    index("bitgold_ledger_entries_transaction_idx").on(table.transactionId),
  ],
);

export const auditEventsTable = pgTable(
  "bitgold_audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    details: jsonb("details").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("bitgold_audit_events_created_idx").on(table.createdAt)],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWalletBalanceSchema = createInsertSchema(walletBalancesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWalletTransactionSchema = createInsertSchema(walletTransactionsTable).omit({
  id: true,
  createdAt: true,
  decidedAt: true,
});
export const insertLedgerEntrySchema = createInsertSchema(ledgerEntriesTable).omit({
  id: true,
  createdAt: true,
});
export const insertAuditEventSchema = createInsertSchema(auditEventsTable).omit({
  id: true,
  createdAt: true,
});
export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  id: true,
  createdAt: true,
  lastSeenAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type InsertWalletBalance = z.infer<typeof insertWalletBalanceSchema>;
export type WalletBalance = typeof walletBalancesTable.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type LedgerEntry = typeof ledgerEntriesTable.$inferSelect;
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;
export type AuditEvent = typeof auditEventsTable.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
