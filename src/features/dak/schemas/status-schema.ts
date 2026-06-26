import { z } from "zod";

import type { DakStatus } from "@/types";

const statusValues = [
  "received",
  "assigned",
  "in_progress",
  "pending",
  "completed",
  "closed",
] as const satisfies readonly DakStatus[];

export const updateDakStatusSchema = z.object({
  dakId: z.string().uuid("Invalid DAK reference"),
  status: z
    .string()
    .min(1, "Please select a status")
    .refine(
      (value): value is DakStatus =>
        statusValues.includes(value as DakStatus),
      { message: "Please select a valid status" }
    ),
  remarks: z
    .string()
    .max(500, "Remarks must be 500 characters or fewer")
    .optional(),
});

export type UpdateDakStatusInput = z.infer<typeof updateDakStatusSchema>;
