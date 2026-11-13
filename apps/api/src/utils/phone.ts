import { AppError } from "./errors";
import { ERROR_CODES } from "@waitless/shared";

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  let normalized = digits;
  if (normalized.length === 12 && normalized.startsWith("91")) {
    normalized = normalized.slice(2);
  } else if (normalized.length === 11 && normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(normalized)) {
    throw new AppError(
      ERROR_CODES.INVALID_PHONE,
      "Enter a valid 10-digit Indian mobile number",
      { field: "phone" },
    );
  }

  return `+91${normalized}`;
}

export function safeName(input: string): string {
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 2) {
    throw AppError.badRequest("Name must be at least 2 characters", { field: "fullName" });
  }
  return name;
}
