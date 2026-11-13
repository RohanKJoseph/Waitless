import { z } from "zod";

export const departmentFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(20)
    .transform((v) => v.toUpperCase()),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
});

export const departmentCreateSchema = departmentFormSchema.transform((v) => ({
  name: v.name,
  code: v.code,
  description: v.description || undefined,
  location: v.location || undefined,
}));

export const departmentUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  code: z.string().trim().min(2).max(20).transform((v) => v.toUpperCase()).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const doctorFormSchema = z.object({
  departmentId: z.string().min(1, "Select a department"),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  designation: z.string().trim().min(2, "Designation is required").max(120),
  avgConsultMinutes: z.coerce.number().int().min(3).max(120),
  roomId: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const doctorCreateSchema = doctorFormSchema;
export const doctorUpdateSchema = doctorFormSchema.partial();

export type DepartmentFormValues = z.input<typeof departmentFormSchema>;
export type DoctorFormValues = z.input<typeof doctorFormSchema>;
