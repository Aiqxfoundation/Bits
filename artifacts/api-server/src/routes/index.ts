import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accountRouter from "./account";
import walletRouter from "./wallet";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountRouter);
router.use(walletRouter);
router.use(adminRouter);

export default router;
