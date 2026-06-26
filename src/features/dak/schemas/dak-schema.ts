import { z } from "zod";

import type { PriorityLevel } from "@/types";

export const PRIORITY_OPTIONS = [
  { value: "routine", label: "Routine" },
  { value: "important", label: "Important" },
  { value: "urgent", label: "Urgent" },
  { value: "immediate", label: "Immediate" },
] as const satisfies ReadonlyArray<{ value: PriorityLevel; label: string }>;

const priorityValues = ["routine", "important", "urgent", "immediate"] as const;

export const createDakSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(5, "Subject must be at least 5 characters"),
  senderName: z
    .string()
    .trim()
    .min(2, "Sender name must be at least 2 characters"),
  senderAddress: z
    .string()
    .trim()
    .min(5, "Sender address must be at least 5 characters"),
  priority: z
    .string()
    .min(1, "Please select a priority level")
    .refine(
      (value): value is (typeof priorityValues)[number] =>
        priorityValues.includes(value as (typeof priorityValues)[number]),
      { message: "Please select a priority level" }
    ),
  departmentId: z
    .string({ error: "Please select a department" })
    .min(1, "Please select a department")
    .uuid("Please select a valid department"),
  dueDate: z
    .string()
    .min(1, "Due date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Please enter a valid due date",
    }),
  remarks: z.string().max(1000, "Remarks must be 1000 characters or fewer"),
});

export type CreateDakInput = z.infer<typeof createDakSchema>;

export type CreateDakFormValues = {
  subject: string;
  senderName: string;
  senderAddress: string;
  priority: string;
  departmentId: string;
  dueDate: string;
  remarks: string;
};
