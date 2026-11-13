import { Redis } from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

/**
 * Shared Redis connection for health checks and BullMQ producers.
 * BullMQ requires `maxRetriesPerRequest: null` on the connection it owns.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: (attempt) => Math.min(attempt * 200, 5_000),
  });

redis.on("error", (error) => logger.error({ err: error }, "redis error"));

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;

export async function checkRedis(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch (error) {
    logger.error({ err: error }, "redis unreachable");
    return false;
  }
}
