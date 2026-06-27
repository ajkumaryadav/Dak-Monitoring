import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDakDate } from "@/features/dak/lib/dak-display";
import { getEscalationLevelLabel } from "@/features/sla/lib/sla-constants";
import {
  getEffectiveSlaDate,
  SlaStatusBadge,
} from "@/features/sla/lib/sla-display";
import type { SlaComplianceRow } from "@/features/sla/lib/sla-types";

interface SlaReportTableProps {
  rows: SlaComplianceRow[];
  showEscalation?: boolean;
}

export function SlaReportTable({
  rows,
  showEscalation = false,
}: SlaReportTableProps) {
  if (!rows.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No records match the current filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="px-3">DAK No.</TableHead>
            <TableHead className="px-3">Subject</TableHead>
            <TableHead className="px-3">Priority</TableHead>
            <TableHead className="px-3">SLA Due</TableHead>
            <TableHead className="px-3">SLA Status</TableHead>
            {showEscalation && (
              <TableHead className="px-3">Escalation</TableHead>
            )}
            <TableHead className="px-3">Days Left</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="px-3">
                <Link
                  href={`/dashboard/dak/${row.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {row.dak_number}
                </Link>
              </TableCell>
              <TableCell className="max-w-xs px-3 text-muted-foreground">
                {row.subject}
              </TableCell>
              <TableCell className="px-3 capitalize">{row.priority}</TableCell>
              <TableCell className="px-3 whitespace-nowrap">
                {formatDakDate(
                  getEffectiveSlaDate({
                    slaDueDate: row.sla_due_date,
                    dueDate: row.due_date,
                  })
                )}
              </TableCell>
              <TableCell className="px-3">
                <SlaStatusBadge
                  entry={{
                    slaDueDate: row.sla_due_date,
                    dueDate: row.due_date,
                    escalationLevel: row.escalation_level,
                  }}
                />
              </TableCell>
              {showEscalation && (
                <TableCell className="px-3">
                  {row.escalation_level >= 1 ? (
                    <Badge variant="outline" className="border-red-950/30 bg-red-950/10 text-red-950 dark:text-red-300">
                      {getEscalationLevelLabel(row.escalation_level)}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
              )}
              <TableCell className="px-3 tabular-nums">
                {row.days_remaining ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
