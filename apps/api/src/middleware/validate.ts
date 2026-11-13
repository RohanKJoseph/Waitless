import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

/**
 * Parses and replaces a request part with the zod-validated value. Handlers can
 * then trust req.body/req.query completely.
 */
export function validate<T>(schema: ZodType<T>, part: RequestPart = "body"): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Express 5 makes req.query a getter; assigning to it would throw.
    if (part === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[part] = result.data as Request[typeof part];
    }
    next();
  };
}
