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

const baseUserObject = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or fewer"),
  email: z
    .string()
    .trim()
    .max(255, "Email must be 255 characters or fewer")
    .email("Valid email is required"),
  mobile: z
    .string()
    .trim()
    .max(20, "Mobile number must be 20 characters or fewer")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  designation: z
    .string()
    .trim()
    .min(2, "Designation must be at least 2 characters")
    .max(100, "Designation must be 100 characters or fewer"),
  employeeCode: z
    .string()
    .trim()
    .max(50, "Employee code must be 50 characters or fewer")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  password: z
    .string()
    .max(128, "Password must be 128 characters or fewer")
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
});

function applyUserRefinements<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data: any, ctx) => {
    if (data.role === "department_user") {
      if (!data.departmentId) {
        ctx.addIssue({
          code: "custom",
          message: "Department is required for department users",
          path: ["departmentId"],
        });
      }
      if (data.sectionId) {
        ctx.addIssue({
          code: "custom",
          message: "Section must be empty for department users",
          path: ["sectionId"],
        });
      }
    }
    if (data.role === "section_user" || data.role === "dak_operator") {
      if (!data.sectionId) {
        ctx.addIssue({
          code: "custom",
          message:
            data.role === "dak_operator"
              ? "Internal section is required for DAK Operator"
              : "Internal section is required for section users",
          path: ["sectionId"],
        });
      }
      if (data.departmentId) {
        ctx.addIssue({
          code: "custom",
          message:
            data.role === "dak_operator"
              ? "Department must be empty for DAK Operator"
              : "Department must be empty for internal section users",
          path: ["departmentId"],
        });
      }
    }
  });
}

export const userFormSchema = applyUserRefinements(baseUserObject);

export const createUserSchema = applyUserRefinements(
  baseUserObject.extend({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be 128 characters or fewer"),
  })
);

export const updateUserSchema = userFormSchema;

export type UserFormInput = z.infer<typeof userFormSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserFormRole = UserRole;
