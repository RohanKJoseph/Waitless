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
  // Headers already sent: hand back to Express so the socket is destroyed.
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

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(error);
    if (mapped) {
      res.status(mapped.status).json({
        error: { code: mapped.code, message: mapped.message, details: mapped.details, requestId },
      } satisfies ErrorBody);
      return;
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
  switch (error.code) {
    case "P2002": {
      const target = error.meta?.target;
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
        details: { field: error.meta?.field_name },
      };
    default:
      return null;
  }
}
