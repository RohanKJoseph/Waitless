import { z } from "zod";

const minutesSchema = z.coerce.number().int().min(0).max(1439);
const slotMinutesSchema = z.coerce.number().int().min(5).max(240);

export const scheduleCreateSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startMinute: minutesSchema,
    endMinute: minutesSchema,
    slotMinutes: slotMinutesSchema.default(15),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.endMinute > v.startMinute, { message: "endMinute must be after startMinute", path: ["endMinute"] });

export const scheduleUpdateSchema = scheduleCreateSchema.partial();

export const exceptionUpsertSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
    isClosed: z.boolean().default(true),
    startMinute: minutesSchema.optional().nullable(),
    endMinute: minutesSchema.optional().nullable(),
    note: z.string().trim().max(240).optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (!v.isClosed) {
      if (v.startMinute == null || v.endMinute == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "startMinute and endMinute required for override", path: ["startMinute"] });
      } else if (v.endMinute <= v.startMinute) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "endMinute must be after startMinute", path: ["endMinute"] });
      }
    }
  });

export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
});
