import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import type { ActivityLogRecord } from "@/features/activity/services/activity-log";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ActivityLogTableProps {
  entries: ActivityLogRecord[];
}

export function ActivityLogTable({ entries }: ActivityLogTableProps) {
  if (!entries.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No activity recorded for the selected filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="px-3">Time</TableHead>
            <TableHead className="px-3">User</TableHead>
            <TableHead className="px-3">Module</TableHead>
            <TableHead className="px-3">Action</TableHead>
            <TableHead className="px-3">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="px-3 whitespace-nowrap text-muted-foreground">
                {formatDakDateTime(entry.createdAt)}
              </TableCell>
              <TableCell className="px-3">
                <div>
                  <p className="font-medium">{entry.userName ?? "System"}</p>
                  {entry.userRole && (
                    <p className="text-xs capitalize text-muted-foreground">
                      {entry.userRole.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-3">
                <Badge variant="outline" className="capitalize">
                  {entry.module}
                </Badge>
              </TableCell>
              <TableCell className="px-3 font-medium">{entry.action}</TableCell>
              <TableCell className="max-w-md px-3 text-muted-foreground">
                {entry.description ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
