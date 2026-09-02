import { z } from "zod";

import { getDistrictDateString } from "@/features/dak/lib/dak-dates";

const baseRequestFields = {
  dakId: z.string().uuid(),
  remarks: z
    .string()
    .trim()
    .min(5, "Remarks are mandatory (minimum 5 characters)"),
};

export const submitTransferRequestSchema = z.object({
  ...baseRequestFields,
  requestType: z.literal("transfer"),
  targetDepartmentId: z.string().uuid("Select a target department"),
});

export const submitEscalationRequestSchema = z.object({
  ...baseRequestFields,
  requestType: z.literal("escalation"),
});

export const submitExtensionRequestSchema = z.object({
  ...baseRequestFields,
  requestType: z.literal("extension"),
  requestedDueDate: z
    .string()
    .min(1, "Requested due date is required")
    .refine((value) => value.slice(0, 10) >= getDistrictDateString(), {
      message: "Requested due date must be on or after today",
    }),
});

export const submitClarificationRequestSchema = z.object({
  ...baseRequestFields,
  requestType: z.literal("clarification"),
});

export const submitDakRequestSchema = z.discriminatedUnion("requestType", [
  submitTransferRequestSchema,
  submitEscalationRequestSchema,
  submitExtensionRequestSchema,
  submitClarificationRequestSchema,
]);

export const reviewDakRequestSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  reviewRemarks: z
    .string()
    .trim()
    .min(5, "Review remarks are mandatory (minimum 5 characters)"),
});

export type SubmitDakRequestInput = z.infer<typeof submitDakRequestSchema>;
export type ReviewDakRequestInput = z.infer<typeof reviewDakRequestSchema>;
