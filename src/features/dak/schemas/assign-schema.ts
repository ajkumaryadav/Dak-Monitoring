import { z } from "zod";

export const ASSIGNMENT_TYPE_OPTIONS = [
  { value: "department", label: "Department" },
  { value: "section", label: "Internal Section" },
] as const;

const baseAssignFields = {
  dakId: z.string().uuid("Invalid DAK reference"),
  assignedUserId: z
    .string({ error: "Please select an officer" })
    .min(1, "Please select an officer")
    .uuid("Please select a valid officer"),
  remarks: z
    .string()
    .max(500, "Remarks must be 500 characters or fewer")
    .optional(),
};

export const assignDakSchema = z.discriminatedUnion("assignmentType", [
  z.object({
    ...baseAssignFields,
    assignmentType: z.literal("department"),
    departmentId: z
      .string({ error: "Please select a department" })
      .min(1, "Please select a department")
      .uuid("Please select a valid department"),
    assignmentUnitId: z.literal("").optional(),
  }),
  z.object({
    ...baseAssignFields,
    assignmentType: z.literal("section"),
    assignmentUnitId: z
      .string({ error: "Please select an internal section" })
      .min(1, "Please select an internal section")
      .uuid("Please select a valid section"),
    departmentId: z.literal("").optional(),
  }),
]);

export type AssignDakInput = z.infer<typeof assignDakSchema>;
