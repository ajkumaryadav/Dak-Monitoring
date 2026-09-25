"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Only log sanitized error without exposing sensitive client details
    console.error("[Application Error]", error?.message ? "Internal Error" : "");
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-6 shadow-xl text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          An Unexpected Error Occurred
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The application encountered an unexpected state. For security reasons, detailed error traces are recorded in server logs only.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
