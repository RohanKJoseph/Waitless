import { ERROR_CODES, ERROR_STATUS, type ErrorCode } from "@waitless/shared";

/**
 * Every failure the API returns deliberately is an AppError: it carries a
 * stable code, an HTTP status and (optionally) field-level details.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.details = details;
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new AppError(ERROR_CODES.BAD_REQUEST, message, details);
  }

  static unauthorized(message = "Authentication required", details?: unknown) {
    return new AppError(ERROR_CODES.UNAUTHORIZED, message, details);
  }

  static forbidden(message = "You do not have access to this resource", details?: unknown) {
    return new AppError(ERROR_CODES.FORBIDDEN, message, details);
  }

  static notFound(message = "Resource not found", details?: unknown) {
    return new AppError(ERROR_CODES.NOT_FOUND, message, details);
  }

  static conflict(code: ErrorCode = ERROR_CODES.CONFLICT, message = "Conflict", details?: unknown) {
    return new AppError(code, message, details);
  }

  static validation(details: unknown, message = "Validation failed") {
    return new AppError(ERROR_CODES.VALIDATION_FAILED, message, details);
  }

  static notImplemented(message = "Not implemented yet") {
    return new AppError(ERROR_CODES.NOT_IMPLEMENTED, message);
  }

  static internal(message = "Something went wrong", details?: unknown) {
    return new AppError(ERROR_CODES.INTERNAL, message, details);
  }
}
