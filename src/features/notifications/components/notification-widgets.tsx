import Link from "next/link";
import { AlertTriangle, Bell, Flame, Zap } from "lucide-react";

import { NotificationList } from "@/features/notifications/components/notification-list";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import type { PriorityDakRow } from "@/features/notifications/services/notify-dak-event";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationWidgetProps {
  notifications: NotificationRecord[];
  unreadCount: number;
  limit?: number;
}

/** Dashboard widget showing recent notifications. */
export function NotificationWidget({
  notifications,
  unreadCount,
  limit = 5,
}: NotificationWidgetProps) {
  const recent = notifications.slice(0, limit);

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-destructive">{unreadCount}</span>{" "}
          unread notification{unreadCount === 1 ? "" : "s"}
        </p>
      )}
      <NotificationList notifications={recent} showActions={false} />
      <Link
        href="/dashboard/notifications"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
      >
        <Bell className="size-4" />
        View all notifications
      </Link>
    </div>
  );
}

interface OverdueAlertCardsProps {
  overdueCount: number;
  topOverdue: Array<{
    id: string;
    dak_number: string;
    subject: string;
    due_date: string | null;
  }>;
  reportsHref?: string;
}

/** Dashboard overdue alert summary cards. */
export function OverdueAlertCards({
  overdueCount,
  topOverdue,
  reportsHref = "/dashboard/reports/pending?overdue=1",
}: OverdueAlertCardsProps) {
  if (!overdueCount) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-800 dark:text-emerald-300">
        No overdue DAK at this time.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-destructive">
              {overdueCount} Overdue DAK Alert{overdueCount === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Active correspondence past due date requiring immediate attention.
            </p>
            <Link
              href={reportsHref}
              className="mt-2 inline-block text-xs font-medium text-destructive hover:underline"
            >
              View overdue report →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {topOverdue.slice(0, 4).map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/dak/${item.id}`}
            className="rounded-lg border border-destructive/15 bg-background/80 p-3 transition-colors hover:border-destructive/30 hover:bg-destructive/[0.03]"
          >
            <p className="text-sm font-semibold text-primary">{item.dak_number}</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {item.subject}
            </p>
            <p className="mt-1 text-[11px] text-destructive">
              Due {item.due_date?.slice(0, 10) ?? "—"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface DashboardAlertsProps {
  overdueCount: number;
  highPriorityCount: number;
  immediateCount: number;
  unreadCount: number;
  topHighPriority: PriorityDakRow[];
  topImmediate: PriorityDakRow[];
}

/** Dashboard alert summary — overdue, priority, immediate, unread. */
export function DashboardAlerts({
  overdueCount,
  highPriorityCount,
  immediateCount,
  unreadCount,
  topHighPriority,
  topImmediate,
}: DashboardAlertsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AlertStatCard
          label="Overdue DAK"
          count={overdueCount}
          href="/dashboard/reports/pending?overdue=1"
          icon={AlertTriangle}
          tone="destructive"
        />
        <AlertStatCard
          label="High Priority DAK"
          count={highPriorityCount}
          href="/dashboard/dak/pending?priority=important"
          icon={Flame}
          tone="warning"
        />
        <AlertStatCard
          label="Immediate DAK"
          count={immediateCount}
          href="/dashboard/dak/pending?priority=immediate"
          icon={Zap}
          tone="urgent"
        />
        <AlertStatCard
          label="Unread Notifications"
          count={unreadCount}
          href="/dashboard/notifications"
          icon={Bell}
          tone="primary"
        />
      </div>

      {(topHighPriority.length > 0 || topImmediate.length > 0) && (
        <div className="grid gap-3 lg:grid-cols-2">
          {topHighPriority.length > 0 && (
            <PriorityPreviewList
              title="High Priority"
              items={topHighPriority}
              tone="warning"
            />
          )}
          {topImmediate.length > 0 && (
            <PriorityPreviewList
              title="Immediate"
              items={topImmediate}
              tone="urgent"
            />
          )}
        </div>
      )}
    </div>
  );
}

interface AlertStatCardProps {
  label: string;
  count: number;
  href: string;
  icon: typeof Bell;
  tone: "destructive" | "warning" | "urgent" | "primary";
}

const toneStyles = {
  destructive: "border-destructive/25 bg-destructive/5 text-destructive",
  warning: "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-400",
  urgent: "border-orange-500/25 bg-orange-500/5 text-orange-700 dark:text-orange-400",
  primary: "border-primary/25 bg-primary/5 text-primary",
};

function AlertStatCard({ label, count, href, icon: Icon, tone }: AlertStatCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl border p-4 transition-colors hover:opacity-90",
        toneStyles[tone]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{count}</p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/60">
          <Icon className="size-4" />
        </div>
      </div>
    </Link>
  );
}

function PriorityPreviewList({
  title,
  items,
  tone,
}: {
  title: string;
  items: PriorityDakRow[];
  tone: "warning" | "urgent";
}) {
  const borderClass =
    tone === "warning" ? "border-amber-500/20" : "border-orange-500/20";

  return (
    <div className={cn("rounded-xl border bg-background/80 p-3", borderClass)}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title} — top items
      </p>
      <ul className="space-y-1.5">
        {items.slice(0, 3).map((item) => (
          <li key={item.id}>
            <Link
              href={`/dashboard/dak/${item.id}`}
              className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
            >
              <span className="font-medium text-primary">{item.dak_number}</span>
              <span className="ml-2 text-xs capitalize text-muted-foreground">
                {item.priority}
              </span>
              <p className="line-clamp-1 text-xs text-muted-foreground">{item.subject}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
