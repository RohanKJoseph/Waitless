import { createHash, randomUUID } from "node:crypto";
import type { Role } from "@prisma/client";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: Role;
  patientId?: string | null;
  sid?: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  role: Role;
  patientId?: string | null;
  jti: string;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(payload: { userId: string; role: Role; patientId?: string | null }) {
  return jwt.sign(
    {
      sub: payload.userId,
      role: payload.role,
      patientId: payload.patientId ?? null,
      sid: randomUUID(),
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"] },
  );
}

export function signRefreshToken(payload: {
  userId: string;
  role: Role;
  patientId?: string | null;
  jti?: string;
}) {
  const jti = payload.jti ?? randomUUID();
  const token = jwt.sign(
    {
      sub: payload.userId,
      role: payload.role,
      patientId: payload.patientId ?? null,
      jti,
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"] },
  );
  return { token, jti };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export function parseDurationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const amount = Number(match[1]);
  const unit = match[2]!.toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * multipliers[unit]!;
}

export function refreshExpiryDate(): Date {
  return new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_TTL));
}
