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
    <div className="space-y-3">
      {/* Rajasthan tricolor accent + government identity */}
      <div className="auth-step-rise overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-md backdrop-blur-sm">
        <div className="auth-tricolor-bar h-1 w-full" aria-hidden />
        <div className="relative p-3.5 sm:p-4">
          <div className="auth-visual-orb pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/10 blur-2xl" />

          <div className="relative flex items-start gap-3">
            <div className="auth-emblem-pulse flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-amber-500/10 ring-1 ring-primary/20">
              <Landmark className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
                Government of Rajasthan
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-tight text-foreground">
                {appConfig.district} District
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="size-3 shrink-0 text-primary/70" />
                Collectorate · Khairthal-Tijara Administration
              </p>
            </div>
          </div>

          <div className="auth-step-rise relative mt-3 overflow-hidden rounded-lg border border-border/50 bg-gradient-to-br from-muted/50 via-background to-primary/[0.04] p-3">
            <div className="auth-fort-silhouette pointer-events-none absolute inset-x-0 bottom-0 h-12 opacity-[0.07]" aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground">
                  Digital DAK Monitoring Portal
                </p>
                <p className="max-w-[14rem] text-[10px] leading-relaxed text-muted-foreground">
                  Official correspondence tracking for Collector, departments,
                  and internal sections.
                </p>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {trustBadges.map((badge, i) => (
                    <span
                      key={badge}
                      className="auth-badge-fade rounded-md bg-primary/8 px-1.5 py-0.5 text-[8px] font-medium text-primary ring-1 ring-primary/15"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="auth-doc-float relative hidden shrink-0 sm:block">
                <div className="auth-doc-layer-back absolute -left-2 top-2 size-12 rounded-lg border border-border/40 bg-muted/60 shadow-sm" />
                <div className="auth-doc-layer-mid absolute -left-1 top-1 size-12 rounded-lg border border-primary/20 bg-primary/5 shadow-md" />
                <div className="relative flex size-14 flex-col items-center justify-center rounded-xl border border-primary/25 bg-card shadow-lg ring-1 ring-primary/10">
                  <FileCheck className="size-5 text-primary" />
                  <span className="mt-0.5 text-[7px] font-bold tracking-wider text-primary uppercase">
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
