/** Trimmed Supabase env vars — avoids blank pages from accidental spaces in .env.local */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  return {
    url,
    anonKey,
    isConfigured: url.length > 0 && anonKey.length > 0,
  };
}
