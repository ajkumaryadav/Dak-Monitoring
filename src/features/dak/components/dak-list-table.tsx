import Link from "next/link";
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
import {
  formatDakDate,
  formatDakStatus,
  getBadgeClassName,
  getDepartmentName,
  getStatusStyle,
  priorityStyles,
} from "@/features/dak/lib/dak-display";
import type { DakListEntry } from "@/features/dak/services/get-dak-stats";
import { cn } from "@/lib/utils";

interface DakListTableProps {
  entries: DakListEntry[];
  emptyTitle: string;
  emptyDescription: string;
  showRegisterAction?: boolean;
}

export function DakListTable({
  entries,
  emptyTitle,
  emptyDescription,
  showRegisterAction = false,
}: DakListTableProps) {
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
        {showRegisterAction && (
          <Link
            href="/dashboard/dak/new"
            className={cn(buttonVariants(), "mt-2 h-9 gap-1.5 px-4")}
          >
            <Plus className="size-4" />
            Register DAK
          </Link>
        )}
      </div>
    );
  }

  return (
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
        {entries.map((entry) => (
          <TableRow key={entry.id} className="border-border/60">
            <TableCell className="px-4 font-medium">
              <Link
                href={`/dashboard/dak/${entry.id}`}
                className="text-primary hover:underline"
              >
                {entry.dak_number}
              </Link>
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
                className={getBadgeClassName(
                  priorityStyles,
                  entry.priority,
                  "bg-muted text-muted-foreground"
                )}
              >
                {entry.priority}
              </Badge>
            </TableCell>
            <TableCell className="px-4">
                <Badge
                  variant="outline"
                  className={cn("capitalize", getStatusStyle(entry.status))}
                >
                {formatDakStatus(entry.status)}
              </Badge>
            </TableCell>
            <TableCell className="px-4 text-muted-foreground">
              {formatDakDate(entry.due_date)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
