"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
import type { PendingReportRow } from "@/features/reports/services/pending-report";
import { cn } from "@/lib/utils";

type SortKey = keyof Pick<
  PendingReportRow,
  | "dak_number"
  | "subject"
  | "sender"
  | "source_name"
  | "assignment_label"
  | "priority"
  | "status"
  | "due_date"
  | "received_date"
>;

interface PendingReportTableProps {
  rows: PendingReportRow[];
  pageSize?: number;
}

export function PendingReportTable({
  rows,
  pageSize = 10,
}: PendingReportTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("due_date");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(0);
    setSearch("");
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.dak_number.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.sender.toLowerCase().includes(q) ||
        r.source_name.toLowerCase().includes(q) ||
        r.assignment_label.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice(page * pageSize, page * pageSize + pageSize);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
    setPage(0);
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search DAK number, subject, sender, source, assignment…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        className="h-9 w-full max-w-md rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
      />

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {(
                [
                  ["dak_number", "DAK No."],
                  ["subject", "Subject"],
                  ["sender", "Sender"],
                  ["source_name", "Source"],
                  ["assignment_label", "Assignment"],
                  ["priority", "Priority"],
                  ["status", "Status"],
                  ["received_date", "Received"],
                  ["due_date", "Due Date"],
                ] as const
              ).map(([key, label]) => (
                <TableHead key={key} className="px-3 whitespace-nowrap">
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
            {!pageRows.length ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No matching pending DAK entries.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-3 font-medium">
                    <Link
                      href={`/dashboard/dak/${row.id}`}
                      className="text-primary hover:underline"
                    >
                      {row.dak_number}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate px-3">
                    {row.subject}
                  </TableCell>
                  <TableCell className="px-3">{row.sender}</TableCell>
                  <TableCell className="px-3">{row.source_name}</TableCell>
                  <TableCell className="px-3">{row.assignment_label}</TableCell>
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
                    {formatDakDate(row.received_date)}
                  </TableCell>
                  <TableCell className="px-3 text-muted-foreground">
                    {formatDakDate(row.due_date)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {sorted.length} result{sorted.length === 1 ? "" : "s"} · Page {page + 1}{" "}
          of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
