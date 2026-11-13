import { z } from "zod";

export const appointmentCreateSchema = z.object({
  doctorId: z.string().min(1),
  slotStart: z.string().datetime(),
  notes: z.string().trim().max(500).optional().nullable(),
  source: z.enum(["QR", "REMOTE"]).optional(),
});

export const walkInSchema = z.object({
  doctorId: z.string().min(1),
  slotStart: z.string().datetime(),
  patient: z.object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(20),
  }),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const appointmentListQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.string().optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const appointmentCancelSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

export const appointmentRescheduleSchema = z.object({
  slotStart: z.string().datetime(),
  reason: z.string().trim().max(300).optional(),
});

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type WalkInInput = z.infer<typeof walkInSchema>;
