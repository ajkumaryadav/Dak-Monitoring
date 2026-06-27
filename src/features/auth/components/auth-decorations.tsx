/** Minimal auth backdrop — matches dashboard sober styling (no dot/check patterns). */
export function AuthDecorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-24 -right-24 size-80 rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="absolute bottom-0 left-0 size-72 rounded-full bg-muted/40 blur-3xl" />
    </div>
  );
}

/** Demo credentials until Supabase Auth is connected. */
export const demoCredentials = {
  email: "admin@collectorate.gov.in",
  password: "password123",
} as const;
