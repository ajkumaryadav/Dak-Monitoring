import Link from "next/link";
import { Activity } from "lucide-react";

import { ActivityLogTable } from "@/features/activity/components/activity-log-table";
import { canViewActivityLog } from "@/features/activity/lib/activity-permissions";
import { getActivityLogs } from "@/features/activity/services/activity-log";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { GetFilterForm } from "@/components/filters/get-filter-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { sanitizeDateRangeParams } from "@/lib/validation/date-range";
import { redirect } from "next/navigation";

interface ActivityPageProps {
  searchParams: Promise<{
    module?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export const dynamic = "force-dynamic";

const MODULE_OPTIONS = ["auth", "users", "dak", "reports"] as const;

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const user = await requirePermission(PERMISSIONS.ACTIVITY);

  if (!canViewActivityLog(user.role)) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const { dateFrom, dateTo } = sanitizeDateRangeParams(
    params.dateFrom,
    params.dateTo
  );

  const entries = await getActivityLogs(user, {
    module: params.module,
    action: params.action,
    dateFrom,
    dateTo,
    limit: 250,
  });

  const actions = [...new Set(entries.map((e) => e.action))].sort();

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Activity Log"
        description="District-wide user and system activity — logins, user management, DAK operations, and report exports."
        icon={Activity}
      />

      <GetFilterForm
        action="/dashboard/activity"
        className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-2">
          <Label htmlFor="module">Module</Label>
          <select
            id="module"
            name="module"
            defaultValue={params.module ?? ""}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          >
            <option value="">All modules</option>
            {MODULE_OPTIONS.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="action">Action</Label>
          <select
            id="action"
            name="action"
            defaultValue={params.action ?? ""}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          >
            <option value="">All actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
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
            href="/dashboard/activity"
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Reset
          </Link>
        </div>
      </GetFilterForm>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.03] via-background to-background p-5 shadow-sm">
        <ActivityLogTable entries={entries} />
      </div>
    </div>
  );
}
