import {
  ArrowUpRight,
  Building2,
  FileCheck,
  Landmark,
  Shield,
} from "lucide-react";

import { appConfig } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

import { AuthDecorations } from "./auth-decorations";

const highlights = [
  {
    icon: FileCheck,
    title: "DAK Tracking",
    description: "Monitor every correspondence from receipt to final disposal.",
    tag: "Live pipeline",
    colors: {
      card: "hover:border-emerald-200/80",
      icon: "bg-emerald-100 text-emerald-600 ring-emerald-200/80",
      title: "text-emerald-700",
      tag: "bg-emerald-100 text-emerald-700",
      arrow: "group-hover:text-emerald-600",
    },
  },
  {
    icon: Building2,
    title: "Department Workflow",
    description: "Assign tasks and track progress across all departments.",
    tag: "Multi-dept",
    colors: {
      card: "hover:border-sky-200/80",
      icon: "bg-sky-100 text-sky-600 ring-sky-200/80",
      title: "text-sky-700",
      tag: "bg-sky-100 text-sky-700",
      arrow: "group-hover:text-sky-600",
    },
  },
  {
    icon: Shield,
    title: "Secure Access",
    description: "Role-based permissions with a complete audit trail.",
    tag: "RBAC",
    colors: {
      card: "hover:border-violet-200/80",
      icon: "bg-violet-100 text-violet-600 ring-violet-200/80",
      title: "text-violet-700",
      tag: "bg-violet-100 text-violet-700",
      arrow: "group-hover:text-violet-600",
    },
  },
] as const;

export function AuthBrandPanel() {
  return (
    <div className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-border/60 bg-gradient-to-br from-muted/50 via-background to-secondary/30 p-10 text-foreground lg:flex">
      <AuthDecorations variant="light" />

      <div className="relative z-10 flex min-w-0 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Landmark className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {appConfig.name}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {appConfig.shortName}
          </p>
        </div>
      </div>

      <div className="relative z-10 max-w-xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-foreground xl:text-4xl">
            {appConfig.fullName}
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Secure district platform for DAK tracking, workflow management, and
            administrative oversight.
          </p>
        </div>

        <ul className="grid gap-3">
          {highlights.map(({ icon: Icon, title, description, tag, colors }) => (
            <li
              key={title}
              className={cn(
                "group relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md",
                colors.card
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg ring-1",
                    colors.icon
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("text-sm font-semibold", colors.title)}>
                      {title}
                    </p>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                        colors.tag
                      )}
                    >
                      {tag}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
                <ArrowUpRight
                  className={cn(
                    "mt-0.5 size-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                    colors.arrow
                  )}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 border-t border-border/60 pt-5">
        <p className="text-sm font-semibold text-foreground">
          {appConfig.districtAdministration}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          District Governance · Administrative Monitoring
        </p>
      </div>
    </div>
  );
}
