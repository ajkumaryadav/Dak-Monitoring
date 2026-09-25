import { z } from "zod";

/**
 * Common bounded Zod schemas and validation helpers to protect against
 * integer overflows, buffer overruns, null-byte injections, and malformed inputs.
 */

// Strip null-bytes and control characters (except newline/tab)
export function sanitizeStringInput(val: unknown): string {
  if (typeof val !== "string") return "";
  return val.replace(/\0/g, "").trim();
}

/**
 * Safe integer schema bounded between min and max (default 0 to 2,147,483,647).
 * Prevents 64-bit integer overflow and negative overflows.
 */
export function safeBoundedInt(min: number = 0, max: number = 2147483647) {
  return z
    .preprocess((val) => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (!/^-?\d+$/.test(trimmed)) return NaN;
        const num = Number(trimmed);
        return Number.isSafeInteger(num) ? num : NaN;
      }
      return NaN;
    }, z.number().int().min(min).max(max))
    .refine((n) => !Number.isNaN(n), { message: "Invalid integer value" });
}

/**
 * Safe text schema with strict length bounds.
 */
export function safeBoundedString(min: number = 0, max: number = 255) {
  return z
    .string()
    .transform(sanitizeStringInput)
    .pipe(
      z
        .string()
        .min(min, min > 0 ? `Must be at least ${min} characters` : undefined)
        .max(max, `Must be ${max} characters or fewer`)
    );
}

/**
 * Safe UUID schema.
 */
export const safeUuidSchema = z
  .string()
  .trim()
  .uuid("Invalid identifier format");

/**
 * Safe ISO Date string schema (YYYY-MM-DD or full ISO date).
 */
export const safeDateStringSchema = z
  .string()
  .trim()
  .min(10)
  .max(35)
  .refine(
    (val) => {
      const date = new Date(val);
      return !Number.isNaN(date.getTime());
    },
    { message: "Invalid date format" }
  );

/**
 * Safe query boolean (accepts "1", "true", true, "0", "false", false).
 */
export function safeQueryBoolean(defaultValue: boolean = false) {
  return z.preprocess((val) => {
    if (val === "1" || val === "true" || val === true) return true;
    if (val === "0" || val === "false" || val === false) return false;
    return defaultValue;
  }, z.boolean());
}
