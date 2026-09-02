import { z } from "zod";

import type { DakRemarkType } from "@/features/remarks/lib/remark-types";

export const addRemarkSchema = z.object({
  dakId: z.string().uuid("Invalid DAK reference"),
  remarkType: z.enum([
    "remark",
    "internal_note",
    "collector_note",
    "department_remark",
  ] as const satisfies readonly DakRemarkType[]),
  body: z
    .string()
    .trim()
    .min(3, "Remark must be at least 3 characters")
    .max(2000, "Remark must be 2000 characters or fewer"),
});

export type AddRemarkInput = z.infer<typeof addRemarkSchema>;

export const submitAtrSchema = z.object({
  dakId: z.string().uuid("Invalid DAK reference"),
  actionTaken: z
    .string()
    .trim()
    .min(10, "Action taken report must be at least 10 characters")
    .max(5000, "Action taken report must be 5000 characters or fewer"),
});

export type SubmitAtrInput = z.infer<typeof submitAtrSchema>;
