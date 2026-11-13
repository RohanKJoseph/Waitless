import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

// The monorepo keeps a single .env at the root. When the API runs from
// apps/api (turbo/pnpm --filter), the root file is two levels up.
for (const path of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
  loadDotenv({ path, override: false, quiet: true });
}

const booleanish = (defaultValue: "true" | "false") =>
  z
    .enum(["true", "false"])
    .default(defaultValue)
    .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  API_BASE_URL: z.string().default("http://localhost:4000/api/v1"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  TEST_DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  QR_SIGNING_SECRET: z.string().min(8).default("dev-qr-secret-change-me"),

  SEED_ADMIN_NAME: z.string().default("Hospital Admin"),
  SEED_ADMIN_EMAIL: z.string().default("admin@waitless.local"),
  SEED_ADMIN_PHONE: z.string().default("9000000000"),
  SEED_ADMIN_PASSWORD: z.string().default("Admin@12345"),

  GRACE_MINUTES: z.coerce.number().int().min(0).default(10),
  DELAY_MINUTES: z.coerce.number().int().min(0).default(10),
  AUTO_SKIP_ENABLED: booleanish("true"),
  SKIP_POLICY: z.enum(["end", "drop"]).default("end"),
  SWAP_CUTOFF_MINUTES: z.coerce.number().int().min(0).default(60),
  SWAP_EXPIRY_MINUTES: z.coerce.number().int().min(1).default(10),
  READY_ALERT_MINUTES: z.coerce.number().int().min(1).default(30),
  HOSPITAL_TIMEZONE: z.string().default("Asia/Kolkata"),
  DEFAULT_CONSULT_MINUTES: z.coerce.number().int().min(1).default(12),
  SCHEDULE_HORIZON_DAYS: z.coerce.number().int().min(1).max(90).default(7),

  MQTT_URL: z.string().default("mqtt://localhost:1883"),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  DEVICE_HMAC_SECRET: z.string().min(8).default("dev-device-secret-change-me"),
  HARDWARE_ENABLED: booleanish("false"),
  HARDWARE_AUTO_COMPLETE: booleanish("false"),
  AUTO_COMPLETE_DEBOUNCE_MINUTES: z.coerce.number().int().min(1).default(2),
  SENSOR_DEBOUNCE_SECONDS: z.coerce.number().int().min(0).default(5),

  FCM_PROJECT_ID: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  SMS_PROVIDER: z.string().default("mock"),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    // Fail fast — a half-configured server is worse than a crashed one.
    console.error(`Invalid environment configuration:\n${issues}\n\nSee .env.example.`);
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();

export const isDev = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
export const isProd = env.NODE_ENV === "production";

/** Comma-separated WEB_ORIGIN values, for CORS and Socket.IO. */
export const allowedOrigins = env.WEB_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
