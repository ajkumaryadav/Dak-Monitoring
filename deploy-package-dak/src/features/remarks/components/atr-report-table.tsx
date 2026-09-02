import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDakDate } from "@/features/dak/lib/dak-display";
import type { AtrReportRow } from "@/features/remarks/services/atr-report";
import { Badge } from "@/components/ui/badge";

interface AtrReportTableProps {
  rows: AtrReportRow[];
  showAtrStats?: boolean;
}

export function AtrReportTable({ rows, showAtrStats = false }: AtrReportTableProps) {
  if (!rows.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No records match this report.
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
            <TableHead className="px-3">Department</TableHead>
            <TableHead className="px-3">Officer</TableHead>
            <TableHead className="px-3">Priority</TableHead>
            <TableHead className="px-3">Received</TableHead>
            {showAtrStats && (
              <>
                <TableHead className="px-3">ATR Count</TableHead>
                <TableHead className="px-3">Latest ATR</TableHead>
              </>
            )}
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
              <TableCell className="px-3">{row.department_name}</TableCell>
              <TableCell className="px-3">{row.officer_name}</TableCell>
              <TableCell className="px-3 capitalize">
                <Badge variant="secondary">{row.priority}</Badge>
              </TableCell>
              <TableCell className="px-3 whitespace-nowrap">
                {formatDakDate(row.received_date)}
              </TableCell>
              {showAtrStats && (
                <>
                  <TableCell className="px-3 tabular-nums">{row.atr_count}</TableCell>
                  <TableCell className="px-3 whitespace-nowrap">
                    {formatDakDate(row.latest_atr_at)}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
