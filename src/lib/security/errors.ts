/**
 * Centralized safe error handling utilities.
 * Prevents information leakage (stack traces, SQL/database errors, file paths, etc.) to clients.
 */

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /postgres/i,
  /supabase/i,
  /prisma/i,
  /syntax error/i,
  /relation ".*" does not exist/i,
  /column ".*" does not exist/i,
  /violates foreign key constraint/i,
  /violates unique constraint/i,
  /violates check constraint/i,
  /violates not-null constraint/i,
  /at (?:async )?[a-zA-Z0-9_$.]+\s+\([^)]+\)/i, // stack trace lines
  /[A-Z]:\\[^\n\r]+/i, // Windows paths
  /\/(?:home|var|usr|etc|tmp|app|src)\/[^\n\r]+/i, // Unix paths
];

/**
 * Returns a user-safe error message without revealing internal implementation details.
 */
export function formatSafeErrorMessage(
  error: unknown,
  fallbackMessage: string = "An unexpected error occurred. Please try again."
): string {
  if (!error) return fallbackMessage;

  const rawMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error && typeof (error as Record<string, unknown>).message === "string"
      ? (error as Record<string, unknown>).message as string
      : "";

  if (!rawMessage || rawMessage.trim() === "") {
    return fallbackMessage;
  }

  // Check if raw message contains sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return fallbackMessage;
    }
  }

  // If message looks clean (user-facing validation or business rule), return it capped in length
  if (rawMessage.length > 200) {
    return fallbackMessage;
  }

  return rawMessage;
}

/**
 * Safe logger for server-side logs that redacts potential secrets.
 */
export function logSafeError(context: string, error: unknown): void {
  try {
    const rawMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack}`
        : JSON.stringify(error);

    // Redact common secret patterns
    const sanitized = rawMessage
      .replace(/(password|secret|token|dak_auth_token)\s*[:=]\s*["']?[^"'&\s,]+/gi, "$1=***REDACTED***")
      .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]*/g, "[JWT_REDACTED]");

    console.error(`[SECURITY ERROR][${context}]`, sanitized);
  } catch {
    console.error(`[SECURITY ERROR][${context}] Unserializable error occurred`);
  }
}
