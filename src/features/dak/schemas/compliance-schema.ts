import { z } from "zod";

export const saveComplianceDraftSchema = z.object({
  dakId: z.string().uuid("Invalid DAK reference"),
  actionTaken: z
    .string()
    .trim()
    .max(5000, "Action Taken Summary must be 5000 characters or fewer"),
});

export const submitComplianceSchema = z.object({
  dakId: z.string().uuid("Invalid DAK reference"),
  actionTaken: z
    .string()
    .trim()
    .min(10, "Please enter Action Taken Summary.")
    .max(5000, "Action Taken Summary must be 5000 characters or fewer"),
});

export type SaveComplianceDraftInput = z.infer<typeof saveComplianceDraftSchema>;
export type SubmitComplianceInput = z.infer<typeof submitComplianceSchema>;
