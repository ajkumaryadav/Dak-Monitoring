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
  getHistoryEventLabel,
  type DakHistoryEventType,
} from "@/features/audit/lib/history-events";
import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";

interface AuditLogTableProps {
  entries: DakHistoryEntry[];
  pageSize?: number;
}

export function AuditLogTable({ entries, pageSize = 15 }: AuditLogTableProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const pageRows = useMemo(
    () => entries.slice(page * pageSize, page * pageSize + pageSize),
    [entries, page, pageSize]
  );

  if (!entries.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No audit entries match the selected filters.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="px-3">When</TableHead>
              <TableHead className="px-3">DAK No.</TableHead>
              <TableHead className="px-3">Event</TableHead>
              <TableHead className="px-3">Action</TableHead>
              <TableHead className="px-3">Performed By</TableHead>
              <TableHead className="px-3">Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="px-3 text-muted-foreground whitespace-nowrap">
                  {formatDakDateTime(entry.createdAt)}
                </TableCell>
                <TableCell className="px-3 font-medium">
                  {entry.dakNumber ? (
                    <Link
                      href={`/dashboard/dak/${entry.dakId}`}
                      className="text-primary hover:underline"
                    >
                      {entry.dakNumber}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="px-3">
                  <Badge variant="outline" className="capitalize">
                    {getHistoryEventLabel(entry.eventType as DakHistoryEventType)}
                  </Badge>
                </TableCell>
                <TableCell className="px-3">{entry.actionLabel}</TableCell>
                <TableCell className="px-3">
                  {entry.performerName ?? "—"}
                  {entry.performerRole ? (
                    <span className="block text-xs text-muted-foreground capitalize">
                      {entry.performerRole.replace(/_/g, " ")}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="max-w-[240px] truncate px-3 text-muted-foreground">
                  {entry.remarks?.trim() || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {page + 1} of {totalPages} · {entries.length} entries
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
