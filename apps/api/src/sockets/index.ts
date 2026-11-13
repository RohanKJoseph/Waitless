import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { allowedOrigins } from "../config/env";
import { logger } from "../config/logger";

let io: Server | null = null;

/**
 * Phase 1: transport only. Phase 7 adds JWT handshake auth and room joins
 * (`patient:{id}`, `doctor:{id}`, `admin:queue`).
 */
export function initSockets(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: allowedOrigins, credentials: true },
    serveClient: false,
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  io.on("connection", (socket) => {
    logger.debug({ socketId: socket.id }, "socket connected");
    socket.emit("server:hello", { message: "Waitless realtime connected" });
    socket.on("disconnect", (reason) => {
      logger.debug({ socketId: socket.id, reason }, "socket disconnected");
    });
  });

  return io;
}

export function getIo(): Server {
  if (!io) throw new Error("Socket.IO is not initialised yet");
  return io;
}

export async function shutdownSockets(): Promise<void> {
  if (!io) return;
  await io.close();
  io = null;
}
