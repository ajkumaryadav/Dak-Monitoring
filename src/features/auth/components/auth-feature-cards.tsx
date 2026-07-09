"use client";

import {
  BarChart3,
  Bell,
  FileCheck,
  Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";

const features = [
  {
    icon: FileCheck,
    title: "DAK Tracking",
    description: "Receipt to disposal with full audit trail",
    colors: {
      card: "border-emerald-500/20 bg-emerald-500/[0.06] hover:border-emerald-500/35 hover:bg-emerald-500/10",
      icon: "bg-emerald-600 text-white",
    },
  },
  {
    icon: BarChart3,
    title: "District Analytics",
    description: "Priority, SLA, and department performance",
    colors: {
      card: "border-sky-500/20 bg-sky-500/[0.06] hover:border-sky-500/35 hover:bg-sky-500/10",
      icon: "bg-sky-600 text-white",
    },
  },
  {
    icon: Bell,
    title: "Alerts & Escalation",
    description: "Overdue monitoring and notifications",
    colors: {
      card: "border-amber-500/20 bg-amber-500/[0.06] hover:border-amber-500/35 hover:bg-amber-500/10",
      icon: "bg-amber-600 text-white",
    },
  },
  {
    icon: Shield,
    title: "Secure RBAC",
    description: "Role-based access with activity logging",
    colors: {
      card: "border-violet-500/20 bg-violet-500/[0.06] hover:border-violet-500/35 hover:bg-violet-500/10",
      icon: "bg-violet-600 text-white",
    },
  },
] as const;

/** Quick feature highlights with hover effects for the login portal. */
export function AuthFeatureCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {features.map(({ icon: Icon, title, description, colors }) => (
        <div
          key={title}
          className={cn(
            "group rounded-xl border p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
            colors.card
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm",
                colors.icon
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
