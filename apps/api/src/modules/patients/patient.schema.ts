import { z } from "zod";

export const patientSessionSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  phone: z.string().trim().min(10, "Enter a valid mobile number"),
});

export const patientUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email("Enter a valid email").optional().nullable(),
  })
  .refine((value) => value.fullName !== undefined || value.email !== undefined, {
    message: "Provide at least one field to update",
  });

export type PatientSessionInput = z.infer<typeof patientSessionSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
