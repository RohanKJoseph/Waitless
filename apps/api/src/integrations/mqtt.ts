import mqtt, { type MqttClient } from "mqtt";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { ingestHardwareEvent } from "../modules/hardware/hardware.service";

let client: MqttClient | null = null;

export function startMqttIntegration() {
  if (!env.HARDWARE_ENABLED && env.NODE_ENV === "production") return;
  if (client) return;
  try {
    client = mqtt.connect(env.MQTT_URL, {
      username: env.MQTT_USERNAME,
      password: env.MQTT_PASSWORD,
      reconnectPeriod: 5000,
    });
    client.on("connect", () => {
      logger.info({ url: env.MQTT_URL }, "mqtt connected");
      client?.subscribe("waitless/rooms/+/occupancy");
      client?.subscribe("waitless/rooms/+/heartbeat");
    });
    client.on("message", (topic, payload) => {
      void (async () => {
        try {
          const parts = topic.split("/");
          const roomId = parts[2];
          if (!roomId) return;
          const data = JSON.parse(payload.toString("utf8")) as Record<string, unknown>;
          const type = topic.endsWith("/heartbeat") ? "HEARTBEAT" : (String(data.type ?? "OCCUPIED").toUpperCase() as "OCCUPIED" | "VACANT" | "HEARTBEAT");
          await ingestHardwareEvent({ roomId, type, ts: data.ts as string | number | undefined, seq: data.seq as string | number | undefined, payload: data });
        } catch (err) {
          logger.warn({ err, topic }, "failed to process mqtt message");
        }
      })();
    });
    client.on("error", (err) => logger.warn({ err }, "mqtt error"));
  } catch (err) {
    logger.warn({ err }, "mqtt integration not started");
  }
}

export async function stopMqttIntegration() {
  if (!client) return;
  await new Promise<void>((resolve) => client?.end(false, {}, () => resolve()));
  client = null;
}
