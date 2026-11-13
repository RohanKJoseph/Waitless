import { Router } from "express";
import { checkDatabase } from "../../config/prisma";
import { checkRedis } from "../../config/redis";
import { env } from "../../config/env";

export const healthRouter: Router = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "waitless-api",
    version: process.env.npm_package_version ?? "0.1.0",
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness is what a deploy should gate on: the process being up is not
 * enough if Postgres or Redis is unreachable.
 */
healthRouter.get("/ready", async (_req, res) => {
  const [db, cache] = await Promise.all([checkDatabase(), checkRedis()]);
  const ready = db && cache;
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "degraded",
    checks: { db: db ? "up" : "down", redis: cache ? "up" : "down" },
    timestamp: new Date().toISOString(),
  });
});
