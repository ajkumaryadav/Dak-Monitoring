import { Building2 } from "lucide-react";

/** District stats strip — bottom of right column, parallel to portal footer. */
export function AuthDistrictGlancePanel() {
  return (
    <div className="auth-step-rise auth-district-glance overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-primary/[0.06] via-card to-amber-500/[0.05] p-3.5 shadow-lg sm:p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20">
          <Building2 className="size-4" />
        </div>
        <p className="text-sm font-bold tracking-tight text-foreground">
          District Administration at a Glance
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { value: "24×7", label: "Portal Access", accent: "text-sky-600" },
          { value: "100%", label: "Audit Trail", accent: "text-emerald-600" },
          { value: "RBAC", label: "Secure Roles", accent: "text-violet-600" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="auth-stat-pop rounded-xl border border-border/40 bg-background/90 px-2 py-2.5 shadow-sm"
            style={{ animationDelay: `${0.5 + i * 0.1}s` }}
          >
            <p className={`text-base font-bold ${stat.accent}`}>{stat.value}</p>
            <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
