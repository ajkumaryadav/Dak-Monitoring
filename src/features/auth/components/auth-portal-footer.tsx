import { Copyright, Headphones, Landmark, Phone } from "lucide-react";

import { appConfig } from "@/lib/constants/navigation";

/** Styled administration footer — sits below Digital DAK Lifecycle (left column). */
export function AuthPortalFooter() {
  return (
    <footer className="auth-step-rise auth-portal-info-card overflow-hidden rounded-2xl border border-primary/15 shadow-lg">
      <div className="auth-tricolor-bar h-1 w-full" aria-hidden />

      <div className="relative bg-gradient-to-br from-primary/[0.07] via-card to-amber-500/[0.05] p-4 sm:p-5">
        <div className="auth-visual-orb pointer-events-none absolute -bottom-8 -left-8 size-32 rounded-full bg-primary/8 blur-2xl" />

        <div className="relative space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <Landmark className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="auth-portal-admin-title text-base font-bold tracking-tight text-foreground sm:text-lg">
                {appConfig.districtAdministration}
              </p>
              <p className="auth-portal-tagline mt-1.5 text-sm font-medium tracking-wide text-primary/90">
                {appConfig.districtTagline}
              </p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

          <div className="flex items-start gap-2.5">
            <Copyright className="mt-0.5 size-4 shrink-0 text-amber-700/80 dark:text-amber-400/80" />
            <p className="auth-portal-copyright text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
              <span className="font-semibold text-foreground/90">© 2026</span>{" "}
              Copyright{" "}
              <span className="font-medium text-primary">
                {appConfig.copyrightHolder}
              </span>
              , All rights reserved.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="auth-portal-support-chip inline-flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/[0.06] px-3 py-2">
              <Headphones className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
                Tech Support
              </span>
              <a
                href={`mailto:${appConfig.supportEmail}`}
                className="text-[11px] font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
              >
                {appConfig.supportEmail}
              </a>
            </div>

            <div className="auth-portal-ip-chip inline-flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2">
              <Phone className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
              <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                IP Phone = {appConfig.portalIpCode}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
