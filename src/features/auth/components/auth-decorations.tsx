interface AuthDecorationsProps {
  variant?: "light" | "dark";
}

export function AuthDecorations({ variant = "light" }: AuthDecorationsProps) {
  const isDark = variant === "dark";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className={
          isDark
            ? "absolute inset-0 h-full w-full text-primary-foreground/6"
            : "absolute inset-0 h-full w-full text-primary/8 dark:text-primary/12"
        }
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="auth-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-dots)" />
      </svg>

      {isDark ? (
        <>
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary-foreground/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 size-80 rounded-full bg-black/10 blur-3xl" />
          <svg
            viewBox="0 0 320 280"
            className="absolute right-0 bottom-0 w-[min(380px,48%)] text-primary-foreground/8"
            fill="none"
          >
            <rect x="120" y="40" width="160" height="200" rx="12" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.04" transform="rotate(6 200 140)" />
            <rect x="80" y="60" width="160" height="200" rx="12" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.06" transform="rotate(-3 160 160)" />
            <rect x="40" y="80" width="160" height="200" rx="12" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.08" />
            <line x1="68" y1="120" x2="172" y2="120" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="68" y1="145" x2="152" y2="145" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="68" y1="170" x2="160" y2="170" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </>
      ) : (
        <>
          <div className="absolute -top-24 -left-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-1/3 -right-16 size-64 rounded-full bg-primary/8 blur-3xl" />
        </>
      )}
    </div>
  );
}

/** Demo credentials until Supabase Auth is connected. */
export const demoCredentials = {
  email: "admin@collectorate.gov.in",
  password: "password123",
} as const;
