"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollectorAtr } from "@/features/dak/components/collector-atr-provider";
import {
  formatDakDate,
  formatDakDateTime,
  formatPriorityLabel,
  getBadgeClassName,
  getStatusStyle,
  priorityStyles,
} from "@/features/dak/lib/dak-display";
import type { AtrComplianceEntry } from "@/features/dak/services/get-atr-compliance-received";
import { enrichAtrComplianceDisplay } from "@/features/dak/services/get-atr-compliance-received";
import { cn } from "@/lib/utils";

interface AtrComplianceTableProps {
  entries: AtrComplianceEntry[];
  emptyTitle: string;
  emptyDescription: string;
}

export function AtrComplianceTable({
  entries,
  emptyTitle,
  emptyDescription,
}: AtrComplianceTableProps) {
  const collectorAtr = useCollectorAtr();

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileText className="size-7" />
        </div>
        <div>
          <p className="font-medium">{emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-primary/10 bg-primary/[0.04] hover:bg-primary/[0.04]">
          <TableHead className="px-4">DAK Number</TableHead>
          <TableHead className="px-4">Subject</TableHead>
          <TableHead className="px-4">Origin</TableHead>
          <TableHead className="px-4">Department</TableHead>
          <TableHead className="px-4">Submitted By</TableHead>
          <TableHead className="px-4">Submission Date & Time</TableHead>
          <TableHead className="px-4">Priority</TableHead>
          <TableHead className="px-4">Due Date</TableHead>
          <TableHead className="px-4">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const display = enrichAtrComplianceDisplay(entry);
          const isNew = collectorAtr ? !collectorAtr.isViewed(entry.id) : false;

          return (
            <TableRow key={entry.id} className="border-border/60">
              <TableCell className="px-4 font-medium">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/dak/${entry.id}`}
                    className="text-primary hover:underline"
                  >
                    {entry.dak_number}
                  </Link>
                  {isNew && (
                    <Badge className="bg-emerald-600 text-[10px] uppercase hover:bg-emerald-600">
                      New
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] truncate px-4">
                {entry.subject}
              </TableCell>
              <TableCell className="px-4">{display.origin}</TableCell>
              <TableCell className="px-4">{display.department}</TableCell>
              <TableCell className="px-4">
                {entry.submittedBy ?? "—"}
              </TableCell>
              <TableCell className="px-4 text-muted-foreground">
                {formatDakDateTime(entry.submittedAt)}
              </TableCell>
              <TableCell className="px-4">
                <Badge
                  variant="secondary"
                  className={getBadgeClassName(
                    priorityStyles,
                    entry.priority,
                    "bg-muted text-muted-foreground"
                  )}
                >
                  {formatPriorityLabel(entry.priority)}
                </Badge>
              </TableCell>
              <TableCell className="px-4 text-muted-foreground">
                {formatDakDate(entry.due_date)}
              </TableCell>
              <TableCell className="px-4">
                <Badge
                  variant="outline"
                  className={cn("capitalize", getStatusStyle(entry.status))}
                >
                  {display.statusLabel}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
