import { z } from "zod";

export const departmentCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .transform((v) => v.toUpperCase()),
  description: z.string().trim().max(500).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
});

export const departmentUpdateSchema = departmentCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const departmentQuerySchema = z.object({
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  q: z.string().trim().optional(),
});

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;
