import Link from "next/link";
import { format, parseISO } from "date-fns";
import { FileText, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import type { DakStatus, PriorityLevel } from "@/types";
import { cn } from "@/lib/utils";

type DakListEntry = {
  id: string;
  dak_number: string;
  subject: string;
  sender: string;
  priority: PriorityLevel;
  status: DakStatus;
  due_date: string | null;
  departments: { name: string } | { name: string }[] | null;
};

function getDepartmentName(
  departments: DakListEntry["departments"]
): string {
  if (!departments) {
    return "—";
  }

  if (Array.isArray(departments)) {
    return departments[0]?.name ?? "—";
  }

  return departments.name ?? "—";
}

const priorityStyles: Record<PriorityLevel, string> = {
  routine: "bg-muted text-muted-foreground",
  important: "bg-primary/10 text-primary",
  urgent: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  immediate: "bg-destructive/10 text-destructive",
};

const statusStyles: Record<DakStatus, string> = {
  received: "border-primary/30 bg-primary/5 text-primary",
  assigned: "border-[oklch(0.45_0.11_240)]/30 bg-[oklch(0.45_0.11_240)]/10 text-[oklch(0.38_0.11_240)]",
  under_process: "border-[oklch(0.55_0.12_200)]/30 bg-[oklch(0.55_0.12_200)]/10 text-[oklch(0.4_0.1_200)]",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  escalated: "border-orange-600/30 bg-orange-600/10 text-orange-700 dark:text-orange-400",
  disposed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  closed: "border-border bg-muted text-muted-foreground",
};

function formatDueDate(value: string | null) {
  if (!value) {
    return "—";
  }

  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default async function AllDakPage() {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  const canCreate = user
    ? hasPermission(user.role, PERMISSIONS.DAK_ENTRY)
    : false;

  const supabase = createAdminClient();
  const { data: entries } = await supabase
    .from("dak_entries")
    .select(
      "id, dak_number, subject, sender, priority, status, due_date, departments(name)"
    )
    .order("created_at", { ascending: false });

  const dakEntries = (entries ?? []) as DakListEntry[];

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="All DAK"
        description="View and manage registered district correspondence entries."
        icon={FileText}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {dakEntries.length} registered entr
          {dakEntries.length === 1 ? "y" : "ies"}
        </p>
        {canCreate && (
          <Link
            href="/dashboard/dak/new"
            className={cn(buttonVariants(), "h-9 gap-1.5 px-4")}
          >
            <Plus className="size-4" />
            New DAK
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background shadow-sm">
        {!dakEntries.length ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="size-7" />
            </div>
            <div>
              <p className="font-medium">No DAK entries yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Register the first correspondence to begin tracking.
              </p>
            </div>
            {canCreate && (
              <Link
                href="/dashboard/dak/new"
                className={cn(buttonVariants(), "mt-2 h-9 gap-1.5 px-4")}
              >
                <Plus className="size-4" />
                Register DAK
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-primary/10 bg-primary/[0.04] hover:bg-primary/[0.04]">
                <TableHead className="px-4">DAK Number</TableHead>
                <TableHead className="px-4">Subject</TableHead>
                <TableHead className="px-4">Sender</TableHead>
                <TableHead className="px-4">Department</TableHead>
                <TableHead className="px-4">Priority</TableHead>
                <TableHead className="px-4">Status</TableHead>
                <TableHead className="px-4">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dakEntries.map((entry) => (
                <TableRow key={entry.id} className="border-border/60">
                  <TableCell className="px-4 font-medium text-primary">
                    {entry.dak_number}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate px-4">
                    {entry.subject}
                  </TableCell>
                  <TableCell className="px-4">{entry.sender}</TableCell>
                  <TableCell className="px-4">
                    {getDepartmentName(entry.departments)}
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "capitalize",
                        priorityStyles[entry.priority] ??
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {entry.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        statusStyles[entry.status] ??
                          "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {formatStatus(entry.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 text-muted-foreground">
                    {formatDueDate(entry.due_date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
