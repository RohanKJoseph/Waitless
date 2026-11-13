import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { doctorCreateSchema, doctorQuerySchema, doctorUpdateSchema } from "./doctor.schema";
import { createDoctor, deactivateDoctor, getDoctorById, listDoctors, updateDoctor } from "./doctor.service";

export const doctorRouter: Router = Router();

doctorRouter.get("/", validate(doctorQuerySchema, "query"), async (req, res, next) => {
  try {
    const query = req.query as {
      departmentId?: string;
      q?: string;
      includeInactive?: boolean;
      active?: boolean;
      page?: number;
      pageSize?: number;
    };
    const activeOnly = query.active === true || (query.active === undefined && !query.includeInactive);
    const result = await listDoctors({
      departmentId: query.departmentId,
      q: query.q,
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
