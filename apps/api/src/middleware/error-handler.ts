import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ERROR_CODES, ERROR_STATUS, type ErrorCode } from "@waitless/shared";
import { ZodError } from "zod";
import { isDev } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../utils/errors";

interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export function notFoundHandler(req: Request, res: Response): void {
  const body: ErrorBody = {
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      requestId: req.id as string | undefined,
    },
  };
  res.status(404).json(body);
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) return;

  const requestId = req.id as string | undefined;

  if (error instanceof AppError) {
    if (error.status >= 500) {
      logger.error({ err: error, requestId }, "request failed");
    }
    res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details, requestId },
    } satisfies ErrorBody);
    return;
  }

  if (error instanceof ZodError) {
    res.status(ERROR_STATUS.VALIDATION_FAILED).json({
      error: {
        code: ERROR_CODES.VALIDATION_FAILED,
        message: "Validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        })),
        requestId,
      },
    } satisfies ErrorBody);
    return;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError
  ) {
    const mapped = mapPrismaError(error as Prisma.PrismaClientKnownRequestError);
    if (mapped) {
      res.status(mapped.status).json({
        error: { code: mapped.code, message: mapped.message, details: mapped.details, requestId },
      } satisfies ErrorBody);
      return;
    }
  } else if (error && typeof error === "object" && "code" in error && typeof (error as { code: unknown }).code === "string") {
    // Fallback if instance check fails across module boundaries in some TS setups
    const maybe = error as { code: string; meta?: { target?: unknown; field_name?: unknown } };
    if (maybe.code.startsWith("P2")) {
      const mapped = mapPrismaErrorByCode(maybe.code, maybe.meta);
      if (mapped) {
        res.status(mapped.status).json({
          error: { code: mapped.code, message: mapped.message, details: mapped.details, requestId },
        } satisfies ErrorBody);
        return;
      }
    }
  }

  logger.error({ err: error, requestId }, "unhandled error");
  res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL,
      message: "Something went wrong",
      ...(isDev && error instanceof Error ? { details: { message: error.message } } : {}),
      requestId,
    },
  } satisfies ErrorBody);
}

function mapPrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): { code: ErrorCode; status: number; message: string; details?: unknown } | null {
  return mapPrismaErrorByCode(error.code, error.meta as { target?: unknown; field_name?: unknown } | undefined);
}

function mapPrismaErrorByCode(
  code: string,
  meta?: { target?: unknown; field_name?: unknown },
): { code: ErrorCode; status: number; message: string; details?: unknown } | null {
  switch (code) {
    case "P2002": {
      const target = meta?.target;
      return {
        code: ERROR_CODES.CONFLICT,
        status: ERROR_STATUS.CONFLICT,
        message: "A record with these details already exists",
        details: { fields: target },
      };
    }
    case "P2025":
      return {
        code: ERROR_CODES.NOT_FOUND,
        status: ERROR_STATUS.NOT_FOUND,
        message: "Record not found",
      };
    case "P2003":
      return {
        code: ERROR_CODES.CONFLICT,
        status: ERROR_STATUS.CONFLICT,
        message: "This record is still referenced by other data",
        details: { field: meta?.field_name },
      };
    default:
      return null;
  }
}
