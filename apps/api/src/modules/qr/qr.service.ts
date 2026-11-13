import crypto from "node:crypto";
import QRCode from "qrcode";
import { env } from "../../config/env";
import { AppError } from "../../utils/errors";

interface QrPayload {
  v: 1;
  hid: string;
  ts: number;
  sig: string;
}

function sign(data: string) {
  return crypto.createHmac("sha256", env.QR_SIGNING_SECRET).update(data).digest("hex");
}

export async function createHospitalQr() {
  const base: Omit<QrPayload, "sig"> = { v: 1, hid: "waitless-hospital", ts: Date.now() };
  const raw = `${base.v}.${base.hid}.${base.ts}`;
  const payload: QrPayload = { ...base, sig: sign(raw) };
  const token = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const scanUrl = `${env.WEB_ORIGIN.split(",")[0]}/scan/${token}`;
  const qrDataUrl = await QRCode.toDataURL(scanUrl, { margin: 1, width: 320 });
  return { payload, token, scanUrl, qrDataUrl };
}

export function verifyHospitalQr(token: string) {
  let payload: QrPayload;
  try {
    payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as QrPayload;
  } catch {
    throw AppError.badRequest("Invalid QR code");
  }
  if (payload.v !== 1 || !payload.hid || !payload.ts || !payload.sig) {
    throw AppError.badRequest("Invalid QR code");
  }
  const raw = `${payload.v}.${payload.hid}.${payload.ts}`;
  const expected = sign(raw);
  if (!crypto.timingSafeEqual(Buffer.from(payload.sig), Buffer.from(expected))) {
    throw AppError.badRequest("QR code signature is invalid");
  }
  // optional expiry: 24h
  const ageMs = Date.now() - payload.ts;
  if (ageMs > 24 * 60 * 60 * 1000) {
    throw AppError.badRequest("QR code has expired");
  }
  return { valid: true, payload, hid: payload.hid };
}
