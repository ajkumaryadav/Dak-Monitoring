import Link from "next/link";
import { History } from "lucide-react";

import { AuditLogTable } from "@/features/audit/components/audit-log-table";
import {
  DAK_HISTORY_EVENT_LABELS,
  type DakHistoryEventType,
} from "@/features/audit/lib/history-events";
import { getAuditLog } from "@/features/audit/services/dak-history";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { GetFilterForm } from "@/components/filters/get-filter-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { sanitizeDateRangeParams } from "@/lib/validation/date-range";

interface AuditPageProps {
  searchParams: Promise<{
    eventType?: DakHistoryEventType | "";
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const user = await requirePermission(PERMISSIONS.AUDIT);
  const params = await searchParams;
  const { dateFrom, dateTo } = sanitizeDateRangeParams(
    params.dateFrom,
    params.dateTo
  );

  const entries = await getAuditLog(user, {
    eventType: params.eventType,
    dateFrom,
    dateTo,
    limit: 200,
  });

  const eventTypes = Object.keys(
    DAK_HISTORY_EVENT_LABELS
  ) as DakHistoryEventType[];

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Audit History"
        description="District-wide DAK workflow audit trail — registrations, assignments, status changes, and closures."
        icon={History}
      />

      <GetFilterForm
        action="/dashboard/audit"
        className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="space-y-2">
          <Label htmlFor="eventType">Event Type</Label>
          <select
            id="eventType"
            name="eventType"
            defaultValue={params.eventType ?? ""}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          >
            <option value="">All events</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {DAK_HISTORY_EVENT_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateFrom">From Date</Label>
          <input
            id="dateFrom"
            name="dateFrom"
            type="date"
            defaultValue={dateFrom ?? ""}
            max={dateTo || undefined}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTo">To Date</Label>
          <input
            id="dateTo"
            name="dateTo"
            type="date"
            defaultValue={dateTo ?? ""}
            min={dateFrom || undefined}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Apply filters
          </Button>
          <Link
            href="/dashboard/audit"
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Reset
          </Link>
        </div>
      </GetFilterForm>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.03] via-background to-background p-5 shadow-sm">
        <AuditLogTable entries={entries} />
      </div>
    </div>
  );
}
