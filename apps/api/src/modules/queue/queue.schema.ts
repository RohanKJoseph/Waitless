import { z } from "zod";

export const queueQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const queueActionSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});
