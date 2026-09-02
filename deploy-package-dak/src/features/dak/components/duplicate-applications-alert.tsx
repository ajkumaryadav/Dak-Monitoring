"use client";

import { useEffect, useState, useTransition } from "react";

import { checkDuplicateApplications } from "@/features/dak/actions/check-duplicate";
import type { PriorApplicationRow } from "@/features/dak/actions/check-duplicate";
import Link from "next/link";

interface DuplicateApplicationsAlertProps {
  mobile: string;
}

export function DuplicateApplicationsAlert({
  mobile,
}: DuplicateApplicationsAlertProps) {
  const [prior, setPrior] = useState<PriorApplicationRow[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const normalized = mobile.replace(/\D/g, "").slice(-10);
    if (normalized.length !== 10) {
      setPrior([]);
      return;
    }

    startTransition(async () => {
      const rows = await checkDuplicateApplications(normalized);
      setPrior(rows);
    });
  }, [mobile]);

  if (mobile.replace(/\D/g, "").length !== 10) return null;
  if (isPending) {
    return (
      <p className="text-xs text-muted-foreground">Checking prior applications…</p>
    );
  }
  if (prior.length === 0) return null;

  return (
    <div
      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm"
      role="alert"
    >
      <p className="font-medium text-amber-900 dark:text-amber-200">
        Previous applications ({prior.length})
      </p>
      <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-300">
        {prior.map((row) => (
          <li key={row.id}>
            <Link href={`/dashboard/dak/${row.id}`} className="hover:underline">
              {row.formattedDate} — {row.dak_number} — {row.status}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
