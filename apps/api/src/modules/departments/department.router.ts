import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  departmentCreateSchema,
  departmentQuerySchema,
  departmentUpdateSchema,
} from "./department.schema";
import {
  createDepartment,
  getDepartmentById,
  listDepartments,
  softDeleteDepartment,
  updateDepartment,
} from "./department.service";

export const departmentRouter: Router = Router();

departmentRouter.get("/", validate(departmentQuerySchema, "query"), async (req, res, next) => {
  try {
    const query = req.query as { includeInactive?: boolean; active?: boolean; q?: string };
    const activeOnly = query.active === true || (query.active === undefined && !query.includeInactive);
    const departments = await listDepartments({
      includeInactive: query.includeInactive,
      activeOnly: query.active === false ? false : activeOnly,
      q: query.q,
    });
    res.json({ data: { departments } });
  } catch (error) {
    next(error);
  }
});

departmentRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const department = await getDepartmentById(id);
    res.json({ data: { department } });
  } catch (error) {
    next(error);
  }
});

departmentRouter.post(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  validate(departmentCreateSchema),
  async (req, res, next) => {
    try {
      const department = await createDepartment(req.body);
      res.status(201).json({ data: { department } });
    } catch (error) {
      next(error);
    }
  },
);

departmentRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  validate(departmentUpdateSchema),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const department = await updateDepartment(id, req.body);
      res.json({ data: { department } });
    } catch (error) {
      next(error);
    }
  },
);

departmentRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const department = await softDeleteDepartment(id);
      res.json({ data: { department } });
    } catch (error) {
      next(error);
    }
  },
);
