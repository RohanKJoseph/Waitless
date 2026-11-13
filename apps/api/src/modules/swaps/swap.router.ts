import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { swapCreateSchema, swapEligibleSchema, swapListQuerySchema, swapRespondSchema } from "./swap.schema";
import { cancelSwap, createSwapRequest, eligibleForSwap, listSwaps, respondSwap } from "./swap.service";

export const swapRouter: Router = Router();
swapRouter.use(authenticate);

const param = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

swapRouter.get("/", validate(swapListQuerySchema, "query"), async (req, res, next) => {
  try {
    const role = (req.query as { role?: "incoming" | "outgoing" | "all" }).role ?? "all";
    const swaps = await listSwaps(req.auth!, role);
    res.json({ data: { swaps } });
  } catch (error) {
    next(error);
  }
});

swapRouter.post("/eligible", authorize("PATIENT"), validate(swapEligibleSchema), async (req, res, next) => {
  try {
    const eligible = await eligibleForSwap(req.auth!, req.body.appointmentId);
    res.json({ data: { eligible } });
  } catch (error) {
    next(error);
  }
});

swapRouter.post("/", authorize("PATIENT"), validate(swapCreateSchema), async (req, res, next) => {
  try {
    const swap = await createSwapRequest(req.auth!, req.body);
    res.status(201).json({ data: { swap } });
  } catch (error) {
    next(error);
  }
});

swapRouter.patch("/:id/respond", authorize("PATIENT"), validate(swapRespondSchema), async (req, res, next) => {
  try {
    const swap = await respondSwap(req.auth!, param(req.params.id), req.body.action);
    res.json({ data: { swap } });
  } catch (error) {
    next(error);
  }
});

swapRouter.patch("/:id/cancel", async (req, res, next) => {
  try {
    const swap = await cancelSwap(req.auth!, param(req.params.id));
    res.json({ data: { swap } });
  } catch (error) {
    next(error);
  }
});
