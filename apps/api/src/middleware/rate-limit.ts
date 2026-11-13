import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

function keyWithIdentifier(req: Request): string {
  const ip = ipKeyGenerator(req.ip ?? "");
  const body = req.body as { identifier?: unknown; phone?: unknown } | undefined;
  const identifier =
    typeof body?.identifier === "string"
      ? body.identifier.toLowerCase().trim()
      : typeof body?.phone === "string"
        ? body.phone
        : "";
  return identifier ? `${ip}:${identifier}` : ip;
}

export const loginRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: keyWithIdentifier,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many sign-in attempts. Please wait a minute and try again.",
    },
  },
});

export const patientSessionRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many attempts. Please wait a moment and try again.",
    },
  },
});
