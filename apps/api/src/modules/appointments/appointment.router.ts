import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  appointmentCancelSchema,
  appointmentCreateSchema,
  appointmentListQuerySchema,
  appointmentRescheduleSchema,
  walkInSchema,
} from "./appointment.schema";
import {
  cancelAppointment,
  createAppointment,
  createWalkIn,
  getAppointmentById,
  listAppointments,
  rescheduleAppointment,
} from "./appointment.service";

export const appointmentRouter: Router = Router();

appointmentRouter.use(authenticate);

appointmentRouter.post("/", authorize("PATIENT"), validate(appointmentCreateSchema), async (req, res, next) => {
  try {
    const appointment = await createAppointment(req.auth!, req.body);
    res.status(201).json({ data: { appointment } });
  } catch (error) {
    next(error);
  }
});

appointmentRouter.post("/walk-in", authorize("ADMIN", "STAFF"), validate(walkInSchema), async (req, res, next) => {
  try {
    const appointment = await createWalkIn(req.auth!, req.body);
    res.status(201).json({ data: { appointment } });
  } catch (error) {
    next(error);
  }
});

appointmentRouter.get("/", validate(appointmentListQuerySchema, "query"), async (req, res, next) => {
  try {
    const result = await listAppointments(req.auth!, req.query as unknown as Parameters<typeof listAppointments>[1]);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

const param = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

appointmentRouter.get("/:id", async (req, res, next) => {
  try {
    const appointment = await getAppointmentById(req.auth!, param(req.params.id));
    res.json({ data: { appointment } });
  } catch (error) {
    next(error);
  }
});

appointmentRouter.patch("/:id/cancel", validate(appointmentCancelSchema), async (req, res, next) => {
  try {
    const appointment = await cancelAppointment(req.auth!, param(req.params.id), req.body.reason);
    res.json({ data: { appointment } });
  } catch (error) {
    next(error);
  }
});

appointmentRouter.patch("/:id/reschedule", authorize("ADMIN", "STAFF"), validate(appointmentRescheduleSchema), async (req, res, next) => {
  try {
    const appointment = await rescheduleAppointment(req.auth!, param(req.params.id), req.body.slotStart, req.body.reason);
    res.json({ data: { appointment } });
  } catch (error) {
    next(error);
  }
});
