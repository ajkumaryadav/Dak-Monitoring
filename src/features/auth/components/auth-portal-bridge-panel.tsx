import {
  ClipboardList,
  Info,
  Landmark,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import { appConfig } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

const governanceNotes = [
  {
    icon: ShieldCheck,
    text: "Authorized government officers only — all login and file actions are logged for audit.",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 ring-emerald-500/20",
    delay: "0.1s",
  },
  {
    icon: ClipboardList,
    text: "DAK movement follows Collectorate workflow: receipt, assignment, compliance, and closure.",
    color: "text-sky-600",
    bg: "bg-sky-500/10 ring-sky-500/20",
    delay: "0.2s",
  },
  {
    icon: Landmark,
    text: "Aligned with Rajasthan e-Governance and DOIT&C digital service standards.",
    color: "text-violet-600",
    bg: "bg-violet-500/10 ring-violet-500/20",
    delay: "0.3s",
  },
] as const;

/**
 * Fills the flex gap between Digital DAK Lifecycle and the administration footer
 * on large screens while keeping bottom alignment with the right column.
 */
export function AuthPortalBridgePanel() {
  return (
    <div className="auth-step-rise hidden rounded-2xl border border-border/50 bg-gradient-to-br from-muted/40 via-card/80 to-primary/[0.04] p-4 shadow-sm backdrop-blur-sm lg:flex lg:min-h-[4rem] lg:flex-1 lg:flex-col lg:justify-center sm:p-5">
      <div className="relative flex flex-1 flex-col justify-center gap-4">
        <div className="auth-visual-orb auth-glance-glow pointer-events-none absolute -right-4 top-0 size-20 rounded-full bg-primary/8 blur-2xl" />

        <div className="relative flex items-start gap-3">
          <div className="auth-step-pulse flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <ScrollText className="size-4" />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-foreground uppercase">
              <Info className="size-3.5 text-primary" />
              Official Use &amp; Digital Governance
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This portal supports day-to-day DAK monitoring for{" "}
              <span className="font-medium text-foreground">
                {appConfig.district} District
              </span>
              . Officers must use official credentials and follow departmental
              disposal timelines.
            </p>
          </div>
        </div>

        <ul className="relative space-y-2.5 border-t border-border/40 pt-4">
          {governanceNotes.map(({ icon: Icon, text, color, bg, delay }) => (
            <li
              key={text}
              className="auth-point-fade flex items-start gap-3 rounded-lg border border-border/40 bg-background/60 p-3"
              style={{ animationDelay: delay }}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1",
                  bg,
                  color
                )}
              >
                <Icon className="size-4" />
              </div>
              <p className="pt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
