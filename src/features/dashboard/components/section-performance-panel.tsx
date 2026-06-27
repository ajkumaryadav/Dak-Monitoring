import Link from "next/link";
import { Building2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { SimpleSourceChart } from "@/features/reports/charts/simple-charts";
import type { SectionPerformanceRow } from "@/features/reports/services/dashboard-analytics";

interface SectionPerformancePanelProps {
  rows: SectionPerformanceRow[];
}

export function SectionPerformancePanel({ rows }: SectionPerformancePanelProps) {
  return (
    <DashboardSection
      title="Section-wise Performance"
      description="Internal Collectorate section workload — total, pending, overdue, and completed"
      icon={Building2}
      variant="neutral"
    >
      {!rows.length ? (
        <p className="py-4 text-sm text-muted-foreground">
          No section-assigned DAK recorded yet.
        </p>
      ) : (
        <div className="space-y-6">
          <SimpleSourceChart
            data={rows.map((row) => ({
              label: row.unit_name,
              value: row.pending,
            }))}
            emptyMessage="No pending section workload."
          />

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="px-3">Section</TableHead>
                  <TableHead className="px-3">Total</TableHead>
                  <TableHead className="px-3">Pending</TableHead>
                  <TableHead className="px-3">Overdue</TableHead>
                  <TableHead className="px-3">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.unit_id}>
                    <TableCell className="px-3 font-medium">
                      {row.unit_name}
                    </TableCell>
                    <TableCell className="px-3">{row.total}</TableCell>
                    <TableCell className="px-3 text-amber-700 dark:text-amber-400">
                      {row.pending}
                    </TableCell>
                    <TableCell className="px-3 text-destructive">
                      {row.overdue}
                    </TableCell>
                    <TableCell className="px-3 text-emerald-700 dark:text-emerald-400">
                      {row.completed}
                    </TableCell>
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
              View full section-wise report →
            </Link>
          </p>
        </div>
      )}
    </DashboardSection>
  );
}
