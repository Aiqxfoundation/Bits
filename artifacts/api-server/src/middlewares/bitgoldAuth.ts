import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

export const requireSignedIn: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId || !auth.sessionId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  res.locals.clerkUserId = auth.userId;
  res.locals.clerkSessionId = auth.sessionId;
  next();
};

export const requireActiveAccount: RequestHandler = async (_req, res, next) => {
  const clerkUserId = res.locals.clerkUserId as string | undefined;
  const clerkSessionId = res.locals.clerkSessionId as string | undefined;
  if (!clerkUserId || !clerkSessionId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!user) {
    res.status(409).json({ error: "Account setup is incomplete" });
    return;
  }
  if (user.status === "banned") {
    res.status(403).json({ error: "This account is suspended" });
    return;
  }
  if (user.activeSessionId && user.activeSessionId !== clerkSessionId) {
    res.status(409).json({
      error: "This account is active on another device",
      code: "DEVICE_SESSION_MISMATCH",
    });
    return;
  }

  res.locals.account = user satisfies User;
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
