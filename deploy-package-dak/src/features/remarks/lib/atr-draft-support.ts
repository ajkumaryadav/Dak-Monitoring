/** Detect Supabase/Postgres error when migration 000033 has not been applied yet. */
export function isMissingAtrDraftColumnError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes("is_draft") && normalized.includes("does not exist");
}
