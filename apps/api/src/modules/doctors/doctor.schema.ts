import { z } from "zod";

export const doctorCreateSchema = z.object({
  departmentId: z.string().min(1),
  fullName: z.string().trim().min(2).max(120),
  designation: z.string().trim().min(2).max(120),
  avgConsultMinutes: z.coerce.number().int().min(3).max(120).default(12),
  roomId: z.string().trim().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const doctorUpdateSchema = doctorCreateSchema.partial();

export const doctorQuerySchema = z.object({
  departmentId: z.string().optional(),
  q: z.string().trim().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type DoctorCreateInput = z.infer<typeof doctorCreateSchema>;
export type DoctorUpdateInput = z.infer<typeof doctorUpdateSchema>;
