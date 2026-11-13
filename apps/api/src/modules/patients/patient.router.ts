import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { patientSessionRateLimit } from "../../middleware/rate-limit";
import { validate } from "../../middleware/validate";
import { patientSessionSchema, patientUpdateSchema } from "./patient.schema";
import { createOrGetPatientSession, getPatientProfileForUser, updatePatientProfile } from "./patient.service";

export const patientRouter: Router = Router();

patientRouter.post("/session", patientSessionRateLimit, validate(patientSessionSchema), async (req, res, next) => {
  try {
    const result = await createOrGetPatientSession(req.body.fullName, req.body.phone, req, res);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
});

patientRouter.get("/me", authenticate, authorize("PATIENT"), async (req, res, next) => {
  try {
    const profile = await getPatientProfileForUser(req.auth!.userId);
    res.json({ data: { profile } });
  } catch (error) {
    next(error);
  }
});

patientRouter.patch("/me", authenticate, authorize("PATIENT"), validate(patientUpdateSchema), async (req, res, next) => {
  try {
    const profile = await updatePatientProfile(req.auth!.userId, req.body);
    res.json({ data: { profile } });
  } catch (error) {
    next(error);
  }
});
