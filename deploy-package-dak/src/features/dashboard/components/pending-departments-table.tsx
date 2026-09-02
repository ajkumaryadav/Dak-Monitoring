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
import type { DepartmentPerformanceRow } from "@/features/reports/services/dashboard-analytics";

interface PendingDepartmentsTableProps {
  rows: DepartmentPerformanceRow[];
  embedded?: boolean;
}

function DepartmentTableContent({ rows }: { rows: DepartmentPerformanceRow[] }) {
  if (!rows.length) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No departments with pending DAK.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="px-3">Department</TableHead>
            <TableHead className="px-3">Total</TableHead>
            <TableHead className="px-3">Pending</TableHead>
            <TableHead className="px-3">Overdue</TableHead>
            <TableHead className="px-3">Completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.department_id}>
              <TableCell className="px-3 font-medium">
                {row.department_name}
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
  );
}

export function PendingDepartmentsTable({
  rows,
  embedded = false,
}: PendingDepartmentsTableProps) {
  if (embedded) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Top Pending Departments
        </h3>
        <DepartmentTableContent rows={rows} />
      </div>
    );
  }

  return (
    <DashboardSection
      title="Pending Departments"
      description="Departments with the highest pending workload"
      icon={Building2}
      variant="neutral"
    >
      <DepartmentTableContent rows={rows} />
    </DashboardSection>
  );
}
