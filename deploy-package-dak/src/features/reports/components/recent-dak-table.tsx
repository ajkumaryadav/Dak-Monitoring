"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDakDate,
  formatDakStatus,
  getBadgeClassName,
  getStatusStyle,
  priorityStyles,
} from "@/features/dak/lib/dak-display";
import type { RecentDakRow } from "@/features/reports/services/dashboard-analytics";
import { cn } from "@/lib/utils";

type SortKey = keyof Pick<
  RecentDakRow,
  | "dak_number"
  | "subject"
  | "status"
  | "priority"
  | "department_name"
  | "source_name"
  | "due_date"
>;

interface RecentDakTableProps {
  rows: RecentDakRow[];
  pageSize?: number;
}

export function RecentDakTable({ rows, pageSize = 5 }: RecentDakTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("due_date");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
  }, [rows, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice(page * pageSize, page * pageSize + pageSize);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
    setPage(0);
  }

  if (!rows.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No recent DAK entries.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {(
                [
                  ["dak_number", "DAK No."],
                  ["subject", "Subject"],
                  ["source_name", "Source"],
                  ["department_name", "Department"],
                  ["priority", "Priority"],
                  ["status", "Status"],
                  ["due_date", "Due Date"],
                ] as const
              ).map(([key, label]) => (
                <TableHead key={key} className="px-3">
                  <button
                    type="button"
                    onClick={() => toggleSort(key)}
                    className="font-semibold hover:text-primary"
                  >
                    {label}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-3 font-medium">
                  <Link
                    href={`/dashboard/dak/${row.id}`}
                    className="text-primary hover:underline"
                  >
                    {row.dak_number}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[180px] truncate px-3">
                  {row.subject}
                </TableCell>
                <TableCell className="px-3">{row.source_name}</TableCell>
                <TableCell className="px-3">{row.department_name}</TableCell>
                <TableCell className="px-3">
                  <Badge
                    variant="secondary"
                    className={getBadgeClassName(
                      priorityStyles,
                      row.priority,
                      "bg-muted"
                    )}
                  >
                    {row.priority}
                  </Badge>
                </TableCell>
                <TableCell className="px-3">
                  <Badge
                    variant="outline"
                    className={cn("capitalize", getStatusStyle(row.status))}
                  >
                    {formatDakStatus(row.status)}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 text-muted-foreground">
                  {formatDakDate(row.due_date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {page + 1} of {totalPages} · {rows.length} entries
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border px-2 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
