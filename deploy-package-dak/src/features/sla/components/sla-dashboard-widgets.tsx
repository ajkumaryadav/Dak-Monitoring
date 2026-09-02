import Link from "next/link";
import { AlertTriangle, CalendarClock, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDakDate } from "@/features/dak/lib/dak-display";
import { getEscalationLevelLabel } from "@/features/sla/lib/sla-constants";
import {
  getEffectiveSlaDate,
  SlaStatusBadge,
} from "@/features/sla/lib/sla-display";
import type { SlaDakRow } from "@/features/sla/lib/sla-types";
import { cn } from "@/lib/utils";

interface SlaDashboardWidgetsProps {
  overdueEntries: SlaDakRow[];
  escalatedEntries: SlaDakRow[];
  dueTodayEntries: SlaDakRow[];
  dueSoonEntries?: SlaDakRow[];
  variant?: "collector" | "department";
}

export function SlaDashboardWidgets({
  overdueEntries,
  escalatedEntries,
  dueTodayEntries,
  dueSoonEntries = [],
  variant = "collector",
}: SlaDashboardWidgetsProps) {
  if (variant === "department") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <SlaWidgetCard
          title="My Overdue"
          description="Department DAK past SLA due date"
          count={overdueEntries.length}
          icon={AlertTriangle}
          tone="destructive"
          href="/dashboard/reports/pending?overdue=1"
          entries={overdueEntries}
        />
        <SlaWidgetCard
          title="Due Soon"
          description="SLA due tomorrow — action required"
          count={dueSoonEntries.length}
          icon={CalendarClock}
          tone="warning"
          href="/dashboard/reports/sla?dueSoon=1"
          entries={dueSoonEntries}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SlaWidgetCard
        title="Overdue DAK"
        description="District DAK past SLA due date"
        count={overdueEntries.length}
        icon={AlertTriangle}
        tone="destructive"
        href="/dashboard/reports/pending?overdue=1"
        entries={overdueEntries}
      />
      <SlaWidgetCard
        title="Escalated DAK"
        description="Cases escalated beyond assigned officer"
        count={escalatedEntries.length}
        icon={ShieldAlert}
        tone="escalated"
        href="/dashboard/reports/escalation"
        entries={escalatedEntries}
        showEscalation
      />
      <SlaWidgetCard
        title="Due Today"
        description="SLA expires today — immediate follow-up"
        count={dueTodayEntries.length}
        icon={CalendarClock}
        tone="warning"
        href="/dashboard/reports/sla?dueToday=1"
        entries={dueTodayEntries}
      />
    </div>
  );
}

interface SlaWidgetCardProps {
  title: string;
  description: string;
  count: number;
  icon: typeof AlertTriangle;
  tone: "destructive" | "warning" | "escalated";
  href: string;
  entries: SlaDakRow[];
  showEscalation?: boolean;
}

const toneStyles = {
  destructive: "border-red-500/25 bg-red-500/5",
  warning: "border-amber-500/25 bg-amber-500/5",
  escalated: "border-red-950/30 bg-red-950/5 dark:border-red-900/40 dark:bg-red-950/10",
};

function SlaWidgetCard({
  title,
  description,
  count,
  icon: Icon,
  tone,
  href,
  entries,
  showEscalation = false,
}: SlaWidgetCardProps) {
  return (
    <Card className={cn("border", toneStyles[tone])}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-background/70">
            <Icon className="size-5" />
          </div>
        </div>
        <p className="text-3xl font-bold tabular-nums">{count}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {!entries.length ? (
          <p className="text-sm text-muted-foreground">No items in this queue.</p>
        ) : (
          entries.slice(0, 3).map((entry) => (
            <Link
              key={entry.id}
              href={`/dashboard/dak/${entry.id}`}
              className="block rounded-lg border border-border/60 bg-background/80 p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-primary">
                  {entry.dak_number}
                </span>
                <SlaStatusBadge
                  entry={{
                    slaDueDate: entry.sla_due_date,
                    dueDate: entry.due_date,
                    escalationLevel: entry.escalation_level,
                  }}
                />
                {showEscalation && entry.escalation_level >= 1 && (
                  <Badge variant="outline" className="text-xs">
                    {getEscalationLevelLabel(entry.escalation_level)}
                  </Badge>
                )}
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {entry.subject}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                SLA {formatDakDate(getEffectiveSlaDate({
                  slaDueDate: entry.sla_due_date,
                  dueDate: entry.due_date,
                }))}
              </p>
            </Link>
          ))
        )}
        <Link
          href={href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
        >
          View report
        </Link>
      </CardContent>
    </Card>
  );
}
