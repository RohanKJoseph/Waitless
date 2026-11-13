import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { doctorCreateSchema, doctorQuerySchema, doctorUpdateSchema } from "./doctor.schema";
import { createDoctor, deactivateDoctor, getDoctorById, listDoctors, updateDoctor } from "./doctor.service";
import { availabilityQuerySchema, exceptionUpsertSchema, scheduleCreateSchema, scheduleUpdateSchema } from "./schedule.schema";
import {
  createSchedule,
  deleteException,
  deleteSchedule,
  getAvailability,
  listExceptions,
  listSchedules,
  updateSchedule,
  upsertException,
} from "./schedule.service";

export const doctorRouter: Router = Router();

doctorRouter.get("/", validate(doctorQuerySchema, "query"), async (req, res, next) => {
  try {
    const query = req.query as {
      departmentId?: string;
      q?: string;
      date?: string;
      includeInactive?: boolean;
      active?: boolean;
      page?: number;
      pageSize?: number;
    };
    const activeOnly = query.active === true || (query.active === undefined && !query.includeInactive);
    const result = await listDoctors({
      departmentId: query.departmentId,
      q: query.q,
      date: query.date,
      includeInactive: query.includeInactive,
      activeOnly: query.active === false ? false : activeOnly,
      page: query.page,
      pageSize: query.pageSize,
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

doctorRouter.get("/:id", async (req, res, next) => {
  try {
    const doctor = await getDoctorById(req.params.id as string);
    res.json({ data: { doctor } });
  } catch (error) {
    next(error);
  }
});

doctorRouter.get("/:id/availability", validate(availabilityQuerySchema, "query"), async (req, res, next) => {
  try {
    const { date } = req.query as { date: string };
    const availability = await getAvailability(req.params.id as string, date);
    res.json({ data: availability });
  } catch (error) {
    next(error);
  }
});

doctorRouter.get("/:id/schedules", async (req, res, next) => {
  try {
    const schedules = await listSchedules(req.params.id as string);
    res.json({ data: { schedules } });
  } catch (error) {
    next(error);
  }
});

doctorRouter.post("/:id/schedules", authenticate, authorize("ADMIN", "STAFF"), validate(scheduleCreateSchema), async (req, res, next) => {
  try {
    const schedule = await createSchedule(req.params.id as string, req.body);
    res.status(201).json({ data: { schedule } });
  } catch (error) {
    next(error);
  }
});

doctorRouter.patch("/:id/schedules/:scheduleId", authenticate, authorize("ADMIN", "STAFF"), validate(scheduleUpdateSchema), async (req, res, next) => {
  try {
    const schedule = await updateSchedule(req.params.id as string, req.params.scheduleId as string, req.body);
    res.json({ data: { schedule } });
  } catch (error) {
    next(error);
  }
});

doctorRouter.delete("/:id/schedules/:scheduleId", authenticate, authorize("ADMIN", "STAFF"), async (req, res, next) => {
  try {
    const result = await deleteSchedule(req.params.id as string, req.params.scheduleId as string);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

doctorRouter.get("/:id/exceptions", async (req, res, next) => {
  try {
    const exceptions = await listExceptions(req.params.id as string);
    res.json({ data: { exceptions } });
  } catch (error) {
    next(error);
  }
});

doctorRouter.put("/:id/exceptions", authenticate, authorize("ADMIN", "STAFF"), validate(exceptionUpsertSchema), async (req, res, next) => {
  try {
    const exception = await upsertException(req.params.id as string, req.body);
    res.json({ data: { exception } });
  } catch (error) {
    next(error);
  }
});

doctorRouter.delete("/:id/exceptions/:exceptionId", authenticate, authorize("ADMIN", "STAFF"), async (req, res, next) => {
  try {
    const result = await deleteException(req.params.id as string, req.params.exceptionId as string);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

doctorRouter.post("/", authenticate, authorize("ADMIN", "STAFF"), validate(doctorCreateSchema), async (req, res, next) => {
  try {
    const doctor = await createDoctor(req.body);
    res.status(201).json({ data: { doctor } });
  } catch (error) {
    next(error);
  }
});

doctorRouter.patch("/:id", authenticate, authorize("ADMIN", "STAFF"), validate(doctorUpdateSchema), async (req, res, next) => {
  try {
    const doctor = await updateDoctor(req.params.id as string, req.body);
    res.json({ data: { doctor } });
  } catch (error) {
    next(error);
  }
});

doctorRouter.delete("/:id", authenticate, authorize("ADMIN", "STAFF"), async (req, res, next) => {
  try {
    const doctor = await deactivateDoctor(req.params.id as string);
    res.json({ data: { doctor } });
  } catch (error) {
    next(error);
  }
});
