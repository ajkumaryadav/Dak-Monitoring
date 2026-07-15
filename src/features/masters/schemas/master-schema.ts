import { z } from "zod";

export const departmentFormSchema = z.object({
  name: z.string().trim().min(2, "Department name is required").max(120),
  shortName: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  isActive: z.boolean().default(true),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export const sectionFormSchema = z.object({
  unitName: z.string().trim().min(2, "Section name is required").max(120),
  departmentId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  isActive: z.boolean().default(true),
});

export type SectionFormValues = z.infer<typeof sectionFormSchema>;
