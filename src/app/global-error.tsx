"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error?.digest ?? "Global internal error");
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-4 bg-slate-50 font-sans text-slate-900">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl text-center">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            System Notice
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            An unexpected error occurred. The technical details have been securely logged.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-medium text-white shadow hover:bg-blue-800"
            >
              Try again
            </button>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
