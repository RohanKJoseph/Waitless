import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { hardwareEventSchema } from "./hardware.schema";
import { ingestHardwareEvent, listRecentHardwareEvents } from "./hardware.service";

export const hardwareRouter: Router = Router();

hardwareRouter.post("/events", validate(hardwareEventSchema), async (req, res, next) => {
  try {
    const result = await ingestHardwareEvent(req.body);
    res.status(result.duplicate ? 200 : 201).json({ data: result });
  } catch (error) {
    next(error);
  }
});

hardwareRouter.get("/events", authenticate, authorize("ADMIN", "STAFF"), async (req, res, next) => {
  try {
    const room = typeof req.query.room === "string" ? req.query.room : undefined;
    const events = await listRecentHardwareEvents(room);
    res.json({ data: { events } });
  } catch (error) {
    next(error);
  }
});
