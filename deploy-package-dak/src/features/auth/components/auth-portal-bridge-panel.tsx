import {
  BadgeCheck,
  Building2,
  ClipboardList,
  FileCheck2,
  Fingerprint,
  Info,
  Landmark,
  Lock,
  Scale,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import { appConfig } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

const governanceNotes = [
  {
    icon: ShieldCheck,
    title: "Audit-ready access",
    text: "Authorized government officers only. Every login, assignment, remark, and closure is captured in an immutable audit trail for Collectorate review.",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 ring-emerald-500/20",
    delay: "0.1s",
  },
  {
    icon: ClipboardList,
    title: "Collectorate workflow",
    text: "Standard DAK path: Receipt & diary → Collector / ADM assignment → department action → ATR / compliance → approval → closure.",
    color: "text-sky-600",
    bg: "bg-sky-500/10 ring-sky-500/20",
    delay: "0.2s",
  },
  {
    icon: Landmark,
    title: "e-Governance aligned",
    text: "Designed for Rajasthan DOIT&C digital service norms — role-based access, SLA monitoring, and district-wide accountability.",
    color: "text-violet-600",
    bg: "bg-violet-500/10 ring-violet-500/20",
    delay: "0.3s",
  },
] as const;

const trustBadges = [
  { icon: Lock, label: "Secure Login", delay: "0.15s" },
  { icon: Fingerprint, label: "Role Verified", delay: "0.3s" },
  { icon: Scale, label: "SLA Bound", delay: "0.45s" },
  { icon: BadgeCheck, label: "Audit Trail", delay: "0.6s" },
] as const;

const dutyPoints = [
  {
    icon: Building2,
    label: "Collectorate control",
    detail: "District-level supervision of pending and escalated files",
  },
  {
    icon: FileCheck2,
    label: "Compliance first",
    detail: "ATR and supporting papers before final disposal",
  },
  {
    icon: ScrollText,
    label: "Registry discipline",
    detail: "Receipt / Dispatch mapping with clear accountability",
  },
] as const;

/**
 * Official Use panel — expands to fill leftover left-column height on desktop
 * so no blank gap appears above it.
 */
export function AuthPortalBridgePanel() {
  return (
    <div className="auth-step-rise relative hidden h-full min-h-0 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-muted/40 via-card/90 to-primary/[0.06] p-5 shadow-md backdrop-blur-sm lg:flex lg:flex-col sm:p-6">
      <div className="auth-tricolor-bar absolute inset-x-0 top-0 h-1" aria-hidden />

      <div className="auth-visual-orb auth-visual-orb-a pointer-events-none absolute -right-8 -top-6 size-36 rounded-full bg-primary/10 blur-3xl" />
      <div className="auth-visual-orb auth-visual-orb-b pointer-events-none absolute -bottom-10 -left-6 size-28 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-5 pt-1">
        <div className="flex items-start gap-4">
          <div className="auth-step-pulse relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
            <ScrollText className="size-5" />
            <span className="auth-step-ring absolute inset-0 rounded-2xl" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground sm:text-lg">
              <Info className="size-4 shrink-0 text-primary" />
              Official Use &amp; Digital Governance
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              This portal supports day-to-day DAK monitoring for{" "}
              <span className="font-semibold text-foreground">
                {appConfig.district} District
              </span>
              . Officers must sign in with official credentials, protect
              confidential correspondence, and clear files within prescribed
              disposal timelines.
            </p>
          </div>

          <div className="auth-doc-float relative hidden shrink-0 xl:flex xl:size-20 xl:flex-col xl:items-center xl:justify-center xl:rounded-2xl xl:border xl:border-primary/20 xl:bg-primary/5 xl:shadow-sm">
            <ShieldCheck className="size-8 text-primary" />
            <span className="mt-1 text-[10px] font-bold tracking-wide text-primary uppercase">
              Secure
            </span>
            <span className="auth-dot-pulse absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {trustBadges.map(({ icon: Icon, label, delay }) => (
            <div
              key={label}
              className="auth-stat-pop flex items-center gap-2.5 rounded-xl border border-border/50 bg-background/80 px-3 py-3 shadow-sm"
              style={{ animationDelay: delay }}
            >
              <div className="auth-step-pulse flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="size-4" />
              </div>
              <span className="text-xs font-semibold leading-tight text-foreground sm:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>

        <ul className="grid flex-1 gap-2.5 sm:grid-cols-3">
          {governanceNotes.map(
            ({ icon: Icon, title, text, color, bg, delay }) => (
              <li
                key={title}
                className="auth-point-fade flex h-full items-start gap-3 rounded-xl border border-border/45 bg-background/75 p-3.5 shadow-sm"
                style={{ animationDelay: delay }}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
                    bg,
                    color
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {title}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                    {text}
                  </p>
                </div>
              </li>
            )
          )}
        </ul>

        <div className="grid gap-2 border-t border-border/40 pt-4 sm:grid-cols-3">
          {dutyPoints.map(({ icon: Icon, label, detail }, i) => (
            <div
              key={label}
              className="auth-point-fade flex items-start gap-2.5 rounded-lg bg-primary/[0.04] px-3 py-2.5 ring-1 ring-primary/10"
              style={{ animationDelay: `${0.35 + i * 0.08}s` }}
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground sm:text-sm">
                  {label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
