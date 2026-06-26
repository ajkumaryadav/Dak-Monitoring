import {
  ArrowUpRight,
  Building2,
  FileCheck,
  Landmark,
  Shield,
} from "lucide-react";

import { appConfig } from "@/lib/constants/navigation";

import { AuthDecorations } from "./auth-decorations";

const highlights = [
  {
    icon: FileCheck,
    title: "DAK Tracking",
    description: "Monitor every correspondence from receipt to final disposal.",
    tag: "Live pipeline",
  },
  {
    icon: Building2,
    title: "Department Workflow",
    description: "Assign tasks and track progress across all departments.",
    tag: "Multi-dept",
  },
  {
    icon: Shield,
    title: "Secure Access",
    description: "Role-based permissions with a complete audit trail.",
    tag: "RBAC",
  },
] as const;

export function AuthBrandPanel() {
  return (
    <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
      <AuthDecorations variant="dark" />

      {/* Header — logo + Collectorate Portal badge aligned on one row */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
            <Landmark className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{appConfig.name}</p>
            <p className="truncate text-sm text-primary-foreground/75">
              {appConfig.shortName}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-primary-foreground uppercase">
          Collectorate Portal
        </span>
      </div>

      {/* Hero */}
      <div className="relative z-10 max-w-xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight xl:text-4xl">
            {appConfig.fullName}
          </h1>
          <p className="max-w-md text-base leading-relaxed text-primary-foreground/80">
            Secure district platform for DAK tracking, workflow management, and
            administrative oversight.
          </p>
        </div>

        <ul className="grid gap-3">
          {highlights.map(({ icon: Icon, title, description, tag }) => (
            <li
              key={title}
              className="group relative overflow-hidden rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 backdrop-blur-sm transition-all duration-200 hover:border-primary-foreground/30 hover:bg-primary-foreground/15"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20 ring-1 ring-primary-foreground/20">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{title}</p>
                    <span className="rounded-md bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-primary-foreground/80 uppercase">
                      {tag}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-primary-foreground/70">
                    {description}
                  </p>
                </div>
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-primary-foreground/40 transition-all group-hover:text-primary-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 border-t border-primary-foreground/15 pt-5">
        <p className="text-sm font-semibold text-primary-foreground/95">
          {appConfig.districtAdministration}
        </p>
        <p className="mt-1 text-xs text-primary-foreground/55">
          District Governance · Administrative Monitoring
        </p>
      </div>
    </div>
  );
}
