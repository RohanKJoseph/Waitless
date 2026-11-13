import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createHospitalQr, verifyHospitalQr } from "./qr.service";

export const qrRouter: Router = Router();

qrRouter.get("/hospital", authenticate, authorize("ADMIN", "STAFF"), async (_req, res, next) => {
  try {
    const data = await createHospitalQr();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

qrRouter.post("/verify", validate(z.object({ token: z.string().min(1) })), async (req, res, next) => {
  try {
    const data = verifyHospitalQr(req.body.token);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
