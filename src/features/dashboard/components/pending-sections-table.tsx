import Link from "next/link";
import { ClipboardList } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import type { SectionPerformanceRow } from "@/features/reports/services/dashboard-analytics";

interface PendingSectionsTableProps {
  rows: SectionPerformanceRow[];
}

export function PendingSectionsTable({ rows }: PendingSectionsTableProps) {
  return (
    <DashboardSection
      title="Pending Section-wise Report"
      description="Internal sections with active pending DAK awaiting action"
      icon={ClipboardList}
      variant="primary"
    >
      {!rows.length ? (
        <p className="py-4 text-sm text-muted-foreground">
          No internal sections with pending DAK.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="px-3">Section</TableHead>
                  <TableHead className="px-3">Pending</TableHead>
                  <TableHead className="px-3">Overdue</TableHead>
                  <TableHead className="px-3">Total Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.unit_id}>
                    <TableCell className="px-3 font-medium">
                      {row.unit_name}
                    </TableCell>
                    <TableCell className="px-3 text-amber-700 dark:text-amber-400">
                      {row.pending}
                    </TableCell>
                    <TableCell className="px-3 text-destructive">
                      {row.overdue}
                    </TableCell>
                    <TableCell className="px-3">{row.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            <Link
              href="/dashboard/reports/sections"
              className="font-medium text-primary hover:underline"
            >
              Open detailed pending section report →
            </Link>
          </p>
        </div>
      )}
    </DashboardSection>
  );
}
