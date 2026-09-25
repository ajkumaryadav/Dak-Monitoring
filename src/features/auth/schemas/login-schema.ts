import { z } from "zod";

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(255, "Official email / username must be 255 characters or fewer")
      .optional(),
    password: z
      .string()
      .max(512, "Password must be 512 characters or fewer")
      .optional(),
    credential: z
      .string()
      .max(512, "Credential must be 512 characters or fewer")
      .optional(),
    auth_hash: z
      .string()
      .max(512, "Credential must be 512 characters or fewer")
      .optional(),
    encrypted_payload: z
      .string()
      .max(4096, "Encrypted payload is too large")
      .optional(),
  })
  .refine(
    (data) => !!(data.encrypted_payload || (data.email && (data.password || data.credential || data.auth_hash))),
    {
      message: "Credentials are required",
      path: ["password"],
    }
  );

export type LoginFormValues = z.infer<typeof loginSchema>;
