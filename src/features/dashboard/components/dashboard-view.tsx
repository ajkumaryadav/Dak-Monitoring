import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Flame,
  Landmark,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { DashboardStatCard } from "@/features/dashboard/components/dashboard-stat-card";
import { STATUS_LABELS } from "@/features/dak/lib/workflow";
import type { DashboardStats } from "@/features/dak/services/get-dak-stats";
import { isDepartmentDashboardRole } from "@/lib/auth/permissions";
import { appConfig } from "@/lib/constants/navigation";
import type { SessionUser } from "@/types";

interface DashboardViewProps {
  user: SessionUser;
  stats: DashboardStats;
}

function buildCollectorCards(stats: Extract<DashboardStats, { variant: "collector" }>) {
  return [
    {
      title: "Total DAK",
      value: String(stats.total),
      description: "All correspondence registered in the district",
      icon: FileText,
      variant: "primary" as const,
      href: "/dashboard/dak",
    },
    {
      title: "Pending DAK",
      value: String(stats.pending),
      description: "Active items awaiting workflow action",
      icon: Clock,
      variant: "info" as const,
      href: "/dashboard/dak/pending",
    },
    {
      title: "Completed DAK",
      value: String(stats.completed),
      description: "Completed or closed correspondence",
      icon: CheckCircle2,
      variant: "success" as const,
      href: "/dashboard/dak/completed",
    },
    {
      title: "Overdue DAK",
      value: String(stats.overdue),
      description: "Past due date and not yet completed",
      icon: AlertTriangle,
      variant: "warning" as const,
      href: "/dashboard/dak/pending",
    },
    {
      title: "High Priority DAK",
      value: String(stats.highPriority),
      description: "Urgent or immediate items still in progress",
      icon: Flame,
      variant: "danger" as const,
      href: "/dashboard/dak/pending",
    },
  ];
}

function buildDepartmentCards(
  stats: Extract<DashboardStats, { variant: "department" }>
) {
  return [
    {
      title: "Assigned DAK",
      value: String(stats.assigned),
      description: "Correspondence allocated to your department",
      icon: ClipboardList,
      variant: "primary" as const,
      href: "/dashboard/dak/pending",
    },
    {
      title: "Pending Actions",
      value: String(stats.pendingActions),
      description: "Items requiring department officer action",
      icon: Clock,
      variant: "info" as const,
      href: "/dashboard/dak/pending",
    },
    {
      title: "Overdue Cases",
      value: String(stats.overdue),
      description: "Cases past due date in your department",
      icon: AlertTriangle,
      variant: "warning" as const,
      href: "/dashboard/dak/pending",
    },
    {
      title: "Completed Cases",
      value: String(stats.completed),
      description: "Disposed or closed department cases",
      icon: CheckCircle2,
      variant: "success" as const,
      href: "/dashboard/dak/completed",
    },
  ];
}

export function DashboardView({ user, stats }: DashboardViewProps) {
  const isDepartmentView = isDepartmentDashboardRole(user.role);
  const statCards =
    stats.variant === "department"
      ? buildDepartmentCards(stats)
      : buildCollectorCards(stats);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary via-primary to-[oklch(0.32_0.1_255)] px-6 py-6 text-primary-foreground shadow-lg shadow-primary/15 md:px-8 md:py-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent, transparent 16px, currentColor 16px, currentColor 17px)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
              <Landmark className="size-6" />
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.15em] text-primary-foreground/70 uppercase">
                {appConfig.districtAdministration}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                {isDepartmentView ? "Department Dashboard" : "Collector Dashboard"}
              </h1>
              <p className="mt-1.5 text-sm text-primary-foreground/80">
                Welcome back,{" "}
                <span className="font-medium text-primary-foreground">
                  {user.name}
                </span>
                .{" "}
                {isDepartmentView
                  ? "Track assigned correspondence and pending actions."
                  : "District DAK overview at a glance."}
              </p>
            </div>
          </div>
          <Badge className="w-fit border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground capitalize hover:bg-primary-foreground/15">
            <Sparkles className="size-3" />
            {user.role.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            Key Metrics
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div
          className={
            stats.variant === "department"
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              : "grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
          }
        >
          {statCards.map((stat) => (
            <Link key={stat.title} href={stat.href} className="block">
              <DashboardStatCard {...stat} />
            </Link>
          ))}
        </div>
      </div>

      <DashboardSection
        title="Workflow Pipeline"
        description="DEO Entry → Collector/ADM Assignment → Department Officer → Completed → Closed"
        icon={FileText}
        variant="neutral"
      >
        <div className="flex flex-wrap gap-2">
          {Object.values(STATUS_LABELS).map((label) => (
            <Badge key={label} variant="outline" className="capitalize">
              {label}
            </Badge>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
