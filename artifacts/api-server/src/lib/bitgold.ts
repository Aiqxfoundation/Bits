import { randomBytes } from "node:crypto";
import ipaddr from "ipaddr.js";
import { db, auditEventsTable, ledgerEntriesTable, usersTable, type User } from "@workspace/db";
import type { WalletTransaction } from "@workspace/db";

export const ASSET_SYMBOLS = ["BTG", "BTC", "USDT"] as const;
export const INITIAL_SUPPLY = 21_000_000;
export const BASE_REWARD = 0.5;
export const STREAK_BONUS_PER_DAY = 0.01;
export const MAX_STREAK_BONUS_DAYS = 30;
export const REFERRAL_BONUS_PER_REFERRAL = 0.02;
export const L1_RATE = 0.1;
export const L2_RATE = 0.05;
export const COOLDOWN_HOURS = 24;
export const STREAK_RESET_HOURS = 48;
export const BASE_HASH_POWER = 100;

export const amountNumber = (amount: string | number | null | undefined): number =>
  Number(amount ?? 0);

export const roundBtg = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * 1_000_000) / 1_000_000;

export function newReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let code = "BTG-";
  for (const byte of bytes) code += chars[byte % chars.length];
  return code;
}

export function observedPublicIp(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const address = ipaddr.parse(value.trim());
    if (address.range() !== "unicast") return null;
    return address.toString();
  } catch {
    return null;
  }
}

export function accountDto(user: User, availableBalance: string | number, pendingBalance: string | number) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
    displayName: user.displayName,
    country: user.country,
    balance: amountNumber(availableBalance),
    availableBalance: amountNumber(availableBalance),
    pendingBalance: amountNumber(pendingBalance),
    hashPower: amountNumber(user.hashPower),
    streak: user.streak,
    lastClaimDate: user.lastClaimAt?.toISOString() ?? null,
    totalMined: amountNumber(user.totalMined),
    totalReferralEarnings: amountNumber(user.totalReferralEarnings),
    totalClaims: user.totalClaims,
    referralCode: user.referralCode,
    isInitialAdmin: user.isInitialAdmin,
  };
}

export function transactionDto(transaction: WalletTransaction, username: string | null = null) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    username,
    type: transaction.type,
    assetSymbol: transaction.assetSymbol,
    amount: amountNumber(transaction.amount),
    status: transaction.status,
    description: transaction.description,
    walletAddress: transaction.walletAddress,
    network: transaction.network,
    transactionHash: transaction.transactionHash,
    adminNote: transaction.adminNote,
    createdAt: transaction.createdAt.toISOString(),
    decidedAt: transaction.decidedAt?.toISOString() ?? null,
  };
}

export async function writeLedgerEntry(
  executor: typeof db,
  entry: {
    transactionId: string;
    userId: string;
    assetSymbol: string;
    availableDelta?: number;
    pendingDelta?: number;
    reservedDelta?: number;
    reason: string;
  },
): Promise<void> {
  await executor.insert(ledgerEntriesTable).values({
    transactionId: entry.transactionId,
    userId: entry.userId,
    assetSymbol: entry.assetSymbol,
    availableDelta: String(entry.availableDelta ?? 0),
    pendingDelta: String(entry.pendingDelta ?? 0),
    reservedDelta: String(entry.reservedDelta ?? 0),
    reason: entry.reason,
  });
}

export async function writeAuditEvent(
  actorUserId: string | null,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> | null = null,
): Promise<void> {
  await db.insert(auditEventsTable).values({
    actorUserId,
    action,
    targetType,
    targetId,
    details,
  });
}
