import { Router } from "express";
import { appointmentRouter } from "./modules/appointments/appointment.router";
import { authRouter } from "./modules/auth/auth.router";
import { departmentRouter } from "./modules/departments/department.router";
import { doctorRouter } from "./modules/doctors/doctor.router";
import { healthRouter } from "./modules/health/health.router";
import { hardwareRouter } from "./modules/hardware/hardware.router";
import { notificationRouter } from "./modules/notifications/notification.router";
import { patientRouter } from "./modules/patients/patient.router";
import { qrRouter } from "./modules/qr/qr.router";
import { queueRouter } from "./modules/queue/queue.router";
import { swapRouter } from "./modules/swaps/swap.router";

export const apiRouter: Router = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/patients", patientRouter);
apiRouter.use("/departments", departmentRouter);
apiRouter.use("/doctors", doctorRouter);
apiRouter.use("/appointments", appointmentRouter);
apiRouter.use("/queue", queueRouter);
apiRouter.use("/qr", qrRouter);
apiRouter.use("/swaps", swapRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/hardware", hardwareRouter);

// Feature routers are mounted here as each phase lands:
// apiRouter.use("/admin", adminRouter);
