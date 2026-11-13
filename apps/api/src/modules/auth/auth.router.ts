import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { loginRateLimit } from "../../middleware/rate-limit";
import { loginSchema } from "./auth.schema";
import { getCurrentUser, loginWithPassword, logoutSession, refreshSession } from "./auth.service";

export const authRouter: Router = Router();

authRouter.post("/login", loginRateLimit, validate(loginSchema), async (req, res, next) => {
  try {
    const result = await loginWithPassword(req.body.identifier, req.body.password, req, res);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const result = await refreshSession(req, res);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    await logoutSession(req, res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.auth!.userId);
    res.json({ data: { user } });
  } catch (error) {
    next(error);
  }
});
