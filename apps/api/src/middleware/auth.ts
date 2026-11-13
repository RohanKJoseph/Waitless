import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "../utils/errors";
import { verifyAccessToken } from "../utils/auth";

export interface AuthContext {
  userId: string;
  role: Role;
  patientId?: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    next(AppError.unauthorized("Authentication required"));
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      patientId: (payload.patientId as string | null | undefined) ?? null,
    };
    next();
  } catch {
    next(AppError.unauthorized("Session expired or invalid"));
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      patientId: (payload.patientId as string | null | undefined) ?? null,
    };
  } catch {
    // ignore invalid optional auth
  }
  next();
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(AppError.unauthorized());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(AppError.forbidden("You do not have access to this resource"));
      return;
    }
    next();
  };
}

export function requireSelf(paramName = "patientId") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(AppError.unauthorized());
      return;
    }
    if (req.auth.role === "ADMIN" || req.auth.role === "STAFF") {
      next();
      return;
    }
    const target = req.params[paramName];
    if (!target || req.auth.patientId !== target) {
      next(AppError.forbidden("You can only access your own records"));
      return;
    }
    next();
  };
}
