import { Router } from "express";
import { healthRouter } from "./modules/health/health.router";

export const apiRouter: Router = Router();

apiRouter.use("/health", healthRouter);

// Feature routers are mounted here as each phase lands:
// apiRouter.use("/auth", authRouter);
// apiRouter.use("/departments", departmentRouter);
// apiRouter.use("/doctors", doctorRouter);
// apiRouter.use("/appointments", appointmentRouter);
// apiRouter.use("/queue", queueRouter);
// apiRouter.use("/swaps", swapRouter);
// apiRouter.use("/notifications", notificationRouter);
// apiRouter.use("/admin", adminRouter);
// apiRouter.use("/hardware", hardwareRouter);
