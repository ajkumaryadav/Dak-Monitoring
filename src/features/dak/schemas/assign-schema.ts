import { z } from "zod";

export const assignDakSchema = z.object({
  dakId: z.string().uuid("Invalid DAK reference"),
  departmentId: z
    .string({ error: "Please select a department" })
    .min(1, "Please select a department")
    .uuid("Please select a valid department"),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
  remarks: z
    .string()
    .max(500, "Remarks must be 500 characters or fewer")
    .optional(),
});

export type AssignDakInput = z.infer<typeof assignDakSchema>;
