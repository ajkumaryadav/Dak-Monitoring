import {
  FileCheck,
  Landmark,
  MapPin,
} from "lucide-react";

import { appConfig } from "@/lib/constants/navigation";

const trustBadges = [
  "Digital Governance",
  "Audit Ready",
  "DOIT&C Standards",
  "e-Office Compatible",
] as const;

/** Branding, graphics, and animation panel below the login form. */
export function AuthLoginAsidePanel() {
  return (
    <div className="space-y-4">
      {/* Rajasthan tricolor accent + government identity */}
      <div className="auth-step-rise overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-lg backdrop-blur-sm">
        <div className="auth-tricolor-bar h-1.5 w-full" aria-hidden />
        <div className="relative p-4 sm:p-5">
          <div className="auth-visual-orb pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-primary/10 blur-2xl" />

          <div className="relative flex items-start gap-3">
            <div className="auth-emblem-pulse flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-amber-500/10 ring-1 ring-primary/20">
              <Landmark className="size-7 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
                Government of Rajasthan
              </p>
              <p className="mt-1 text-base font-semibold leading-tight text-foreground">
                {appConfig.district} District
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0 text-primary/70" />
                Collectorate · Khairthal-Tijara Administration
              </p>
            </div>
          </div>

          {/* Animated district illustration */}
          <div className="auth-step-rise relative mt-4 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-muted/50 via-background to-primary/[0.04] p-4">
            <div className="auth-fort-silhouette pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-[0.07]" aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Digital DAK Monitoring Portal
                </p>
                <p className="max-w-[14rem] text-[11px] leading-relaxed text-muted-foreground">
                  Official correspondence tracking for Collector, departments, and
                  internal sections under Rajasthan e-Governance framework.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {trustBadges.map((badge, i) => (
                    <span
                      key={badge}
                      className="auth-badge-fade rounded-md bg-primary/8 px-2 py-0.5 text-[9px] font-medium text-primary ring-1 ring-primary/15"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="auth-doc-float relative hidden shrink-0 sm:block">
                <div className="auth-doc-layer-back absolute -left-2 top-2 size-14 rounded-lg border border-border/40 bg-muted/60 shadow-sm" />
                <div className="auth-doc-layer-mid absolute -left-1 top-1 size-14 rounded-lg border border-primary/20 bg-primary/5 shadow-md" />
                <div className="relative flex size-16 flex-col items-center justify-center rounded-xl border border-primary/25 bg-card shadow-lg ring-1 ring-primary/10">
                  <FileCheck className="size-6 text-primary" />
                  <span className="mt-1 text-[8px] font-bold tracking-wider text-primary uppercase">
                    DAK
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
