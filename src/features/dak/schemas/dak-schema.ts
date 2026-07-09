import { z } from "zod";

import { PRIORITY_DISPOSAL_DAYS } from "@/lib/constants/priority-due-date";
import type { PriorityLevel } from "@/types";

/** Collector-facing priority labels at assignment time. */
export const ASSIGN_PRIORITY_OPTIONS = [
  {
    value: "immediate",
    label: `Immediate — Due Today (${PRIORITY_DISPOSAL_DAYS.immediate} days)`,
  },
  {
    value: "urgent",
    label: `Urgent — ${PRIORITY_DISPOSAL_DAYS.urgent} Days`,
  },
  {
    value: "important",
    label: `Normal — ${PRIORITY_DISPOSAL_DAYS.important} Days`,
  },
  {
    value: "routine",
    label: `Low — ${PRIORITY_DISPOSAL_DAYS.routine} Days`,
  },
] as const satisfies ReadonlyArray<{ value: PriorityLevel; label: string }>;

export const PRIORITY_OPTIONS = [
  { value: "routine", label: "Low" },
  { value: "important", label: "Normal" },
  { value: "urgent", label: "High" },
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
  applicantMobile: z
    .string()
    .trim()
    .min(10, "Enter a valid 10-digit mobile number")
    .transform((v) => v.replace(/\D/g, "").slice(-10))
    .refine((v) => /^\d{10}$/.test(v), {
      message: "Enter a valid 10-digit mobile number",
    }),
  applicantReference: z
    .string()
    .max(50, "Reference must be 50 characters or fewer")
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  departmentId: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined))
    .refine((value) => !value || z.string().uuid().safeParse(value).success, {
      message: "Please select a valid department",
    }),
  sourceId: z
    .string({ error: "Please select a DAK source" })
    .min(1, "Please select a DAK source")
    .uuid("Please select a valid DAK source"),
  remarks: z.string().max(1000, "Remarks must be 1000 characters or fewer"),
  attachment: z.any().optional(),
});

export type CreateDakInput = z.infer<typeof createDakSchema>;

export type CreateDakFormValues = {
  subject: string;
  senderName: string;
  senderAddress: string;
  departmentId?: string;
  sourceId: string;
  remarks: string;
};

export { priorityValues };
