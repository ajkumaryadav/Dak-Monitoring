import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  GitBranch,
  Landmark,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { DashboardStatCard } from "@/features/dashboard/components/dashboard-stat-card";
import { appConfig } from "@/lib/constants/navigation";
import type { SessionUser } from "@/types";

const statCards = [
  {
    title: "Total DAK Received",
    value: "—",
    description: "All correspondence registered in the district",
    icon: FileText,
    variant: "primary" as const,
  },
  {
    title: "Under Process",
    value: "—",
    description: "Active items moving through workflow",
    icon: Clock,
    variant: "info" as const,
  },
  {
    title: "Escalated",
    value: "—",
    description: "Cases requiring senior review",
    icon: AlertTriangle,
    variant: "warning" as const,
  },
  {
    title: "Disposed Today",
    value: "—",
    description: "Completed disposals in the last 24 hours",
    icon: CheckCircle2,
    variant: "success" as const,
  },
];

const workflowStatuses = [
  { label: "Received", color: "bg-primary" },
  { label: "Assigned", color: "bg-[oklch(0.45_0.11_240)]" },
  { label: "Under Process", color: "bg-[oklch(0.55_0.12_200)]" },
  { label: "Pending", color: "bg-amber-500" },
  { label: "Escalated", color: "bg-orange-600" },
];

interface DashboardViewProps {
  user: SessionUser;
}

export function DashboardView({ user }: DashboardViewProps) {
  return (
    <div className="space-y-8">
      {/* Hero header — matches login page navy branding */}
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
                Collector Dashboard
              </h1>
              <p className="mt-1.5 text-sm text-primary-foreground/80">
                Welcome back,{" "}
                <span className="font-medium text-primary-foreground">
                  {user.name}
                </span>
                . District DAK overview at a glance.
              </p>
            </div>
          </div>
          <Badge className="w-fit border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground capitalize hover:bg-primary-foreground/15">
            <Sparkles className="size-3" />
            {user.role.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {/* Stat cards */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            Key Metrics
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <DashboardStatCard key={stat.title} {...stat} />
          ))}
        </div>
      </div>

      {/* Panels */}
      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardSection
          title="Recent Activity"
          description="Timeline of DAK movements and administrative updates"
          icon={Activity}
          variant="primary"
        >
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/[0.03] px-3 py-2.5"
              >
                <Skeleton className="size-9 rounded-full bg-primary/10" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4 bg-primary/10" />
                  <Skeleton className="h-3 w-1/2 bg-primary/5" />
                </div>
                <ArrowRight className="size-4 text-muted-foreground/40" />
              </div>
            ))}
            <p className="pt-1 text-center text-xs text-muted-foreground">
              Activity feed will populate when modules are connected
            </p>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Workflow Pipeline"
          description="DAK status distribution across the district"
          icon={GitBranch}
          variant="neutral"
        >
          <div className="space-y-4">
            {workflowStatuses.map(({ label, color }) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">—</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full w-0 rounded-full ${color} opacity-40`}
                  />
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
