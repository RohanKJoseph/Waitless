import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { allowedOrigins } from "../config/env";
import { logger } from "../config/logger";
import { verifyAccessToken } from "../utils/auth";

let io: Server | null = null;

export function initSockets(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: allowedOrigins, credentials: true },
    serveClient: false,
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  io.use((socket, next) => {
    const token = (socket.handshake.auth as { token?: string } | undefined)?.token;
    if (!token) return next();
    try {
      const payload = verifyAccessToken(token);
      (socket.data as { auth?: unknown }).auth = payload;
      return next();
    } catch {
      return next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const auth = (socket.data as { auth?: { sub?: string; role?: string; patientId?: string | null } }).auth;
    if (auth?.patientId) socket.join(`patient:${auth.patientId}`);
    if (auth?.sub) socket.join(`user:${auth.sub}`);
    if (auth?.role === "ADMIN" || auth?.role === "STAFF") socket.join("admin:queue");
    logger.debug({ socketId: socket.id, role: auth?.role }, "socket connected");
    socket.emit("server:hello", { message: "Waitless realtime connected" });

    socket.on("queue:joinDoctor", (doctorId: string) => {
      if (typeof doctorId === "string" && doctorId) socket.join(`doctor:${doctorId}`);
    });

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
