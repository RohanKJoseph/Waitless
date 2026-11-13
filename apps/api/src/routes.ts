import { Router } from "express";
import { authRouter } from "./modules/auth/auth.router";
import { healthRouter } from "./modules/health/health.router";
import { patientRouter } from "./modules/patients/patient.router";

export const apiRouter: Router = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/patients", patientRouter);

// Feature routers are mounted here as each phase lands:
// apiRouter.use("/departments", departmentRouter);
// apiRouter.use("/doctors", doctorRouter);
// apiRouter.use("/appointments", appointmentRouter);
// apiRouter.use("/queue", queueRouter);
// apiRouter.use("/swaps", swapRouter);
// apiRouter.use("/notifications", notificationRouter);
// apiRouter.use("/admin", adminRouter);
// apiRouter.use("/hardware", hardwareRouter);
