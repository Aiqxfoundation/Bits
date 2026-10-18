import type { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db, sessionsTable, usersTable, type Session, type User } from "@workspace/db";
import { hashSessionToken } from "../lib/auth";

export function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer") return null;
  const token = rest.join("").trim();
  return token || null;
}

/**
 * Resolves the bearer session token to an account. A pending session (a sign-in
 * waiting for an explicit device switch) is signed in, but not yet active.
 */
export const requireSignedIn: RequestHandler = async (req, res, next) => {
  const token = bearerToken(req.header("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [row] = await db
    .select({ session: sessionsTable, user: usersTable })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(eq(sessionsTable.tokenHash, hashSessionToken(token)))
    .limit(1);

  if (!row) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  res.locals.session = row.session satisfies Session;
  res.locals.account = row.user satisfies User;
  next();
};

export const requireActiveAccount: RequestHandler = (_req, res, next) => {
  const user = res.locals.account as User | undefined;
  const session = res.locals.session as Session | undefined;
  if (!user || !session) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (user.status === "banned") {
    res.status(403).json({ error: "This account is suspended" });
    return;
  }
  if (session.status !== "active") {
    res.status(409).json({
      error: "This account is active on another device",
      code: "DEVICE_SESSION_MISMATCH",
    });
    return;
  }

  void db
    .update(sessionsTable)
    .set({ lastSeenAt: new Date() })
    .where(eq(sessionsTable.id, session.id))
    .catch(() => undefined);
  next();
};

export const requireAdministrator: RequestHandler = (_req, res, next) => {
  const user = res.locals.account as User | undefined;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Administrator access required" });
    return;
  }
  next();
};
