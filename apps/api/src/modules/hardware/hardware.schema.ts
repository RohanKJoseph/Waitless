import { z } from "zod";

export const hardwareEventSchema = z.object({
  v: z.number().optional(),
  roomId: z.string().min(1),
  type: z.enum(["OCCUPIED", "VACANT", "HEARTBEAT"]),
  ts: z.union([z.string(), z.number()]).optional(),
  seq: z.union([z.string(), z.number()]).optional(),
  sig: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
