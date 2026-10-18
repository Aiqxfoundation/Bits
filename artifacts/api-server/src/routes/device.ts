import { db, sessionsTable } from "@workspace/db";
import { and, eq, ne } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { requireSignedIn } from "../middlewares/bitgoldAuth";
import { accountDto } from "../lib/bitgold";
import { usersTable, walletBalancesTable } from "@workspace/db";
import { SwitchAccountDeviceResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/account/device/switch", requireSignedIn, async (_req, res): Promise<void> => {
  const account = res.locals.account;
  const session = res.locals.session;
  if (account.status === "banned") {
    res.status(403).json({ error: "This account is suspended" });
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(sessionsTable)
      .where(and(eq(sessionsTable.userId, account.id), ne(sessionsTable.id, session.id)));
    await tx
      .update(sessionsTable)
      .set({ status: "active", lastSeenAt: new Date() })
      .where(eq(sessionsTable.id, session.id));
  });

  const [balance] = await db
    .select()
    .from(walletBalancesTable)
    .where(and(eq(walletBalancesTable.userId, account.id), eq(walletBalancesTable.assetSymbol, "BTG")))
    .limit(1);
  const [fresh] = await db.select().from(usersTable).where(eq(usersTable.id, account.id)).limit(1);
  if (!fresh) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json(
    SwitchAccountDeviceResponse.parse(
      accountDto(fresh, balance?.availableBalance ?? "0", balance?.pendingBalance ?? "0"),
    ),
  );
});

export default router;
