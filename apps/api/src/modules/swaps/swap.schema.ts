import { z } from "zod";

export const swapCreateSchema = z.object({
  requesterAppointmentId: z.string().min(1),
  targetAppointmentId: z.string().min(1),
  message: z.string().trim().max(300).optional().nullable(),
});

export const swapEligibleSchema = z.object({
  appointmentId: z.string().min(1),
});

export const swapRespondSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
});

export const swapListQuerySchema = z.object({
  role: z.enum(["incoming", "outgoing", "all"]).optional().default("all"),
});
