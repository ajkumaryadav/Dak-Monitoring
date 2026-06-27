import { z } from "zod";

import type { UserRole } from "@/types";

const userRoleSchema = z.enum([
  "collector",
  "acp",
  "adm",
  "dak_operator",
  "department_user",
  "section_user",
]);

export const userFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required"),
    email: z.string().trim().email("Valid email is required"),
    mobile: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((v) => v || undefined),
    designation: z.string().trim().min(2, "Designation is required"),
    employeeCode: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((v) => v || undefined),
    password: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((v) => v || undefined),
    role: userRoleSchema,
    departmentId: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((v) => v || null),
    sectionId: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((v) => v || null),
    isActive: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.role === "department_user" && !data.departmentId) {
      ctx.addIssue({
        code: "custom",
        message: "Department is required for department users",
        path: ["departmentId"],
      });
    }
    if (data.role === "section_user" && !data.sectionId) {
      ctx.addIssue({
        code: "custom",
        message: "Section is required for section users",
        path: ["sectionId"],
      });
    }
  });

export const createUserSchema = userFormSchema.safeExtend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateUserSchema = userFormSchema;

export type UserFormInput = z.infer<typeof userFormSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserFormRole = UserRole;
