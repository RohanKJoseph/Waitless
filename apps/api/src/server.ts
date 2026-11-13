import { createServer } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/prisma";
import { redis } from "./config/redis";
import { initSockets, shutdownSockets } from "./sockets";

const app = createApp();
const httpServer = createServer(app);

initSockets(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`Waitless API listening on http://localhost:${env.PORT}/api/v1`);
  logger.info({ environment: env.NODE_ENV, timezone: env.HOSPITAL_TIMEZONE }, "configuration");
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down");

  // Stop accepting connections, then release resources. Anything still open
  // after 10 seconds is force-closed so container restarts are not blocked.
  const forceExit = setTimeout(() => {
    logger.error("graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    await shutdownSockets();
    await prisma.$disconnect();
    redis.disconnect();
    clearTimeout(forceExit);
    logger.info("shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "error during shutdown");
    process.exit(1);
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "unhandled promise rejection");
});
process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "uncaught exception");
  void shutdown("uncaughtException");
});
