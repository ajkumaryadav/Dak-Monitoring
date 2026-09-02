import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { AuthDakVisualPanel } from "@/features/auth/components/auth-dak-visual-panel";
import { AuthDecorations } from "@/features/auth/components/auth-decorations";
import { AuthDistrictGlancePanel } from "@/features/auth/components/auth-district-glance-panel";
import { AuthGovernancePillars } from "@/features/auth/components/auth-governance-pillars";
import { AuthLoginAsidePanel } from "@/features/auth/components/auth-login-aside-panel";
import { AuthPortalBridgePanel } from "@/features/auth/components/auth-portal-bridge-panel";
import { AuthPortalFooter } from "@/features/auth/components/auth-portal-footer";
import { AuthWorkflowStatusPanel } from "@/features/auth/components/auth-workflow-status-panel";
import { fetchPortalPublicStats } from "@/features/auth/services/portal-workflow-stats";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { workflow, glance } = await fetchPortalPublicStats();

  return (
    <div className="auth-portal-shell relative min-h-screen overflow-x-hidden">
      <div className="auth-portal-bg pointer-events-none absolute inset-0" aria-hidden />
      <AuthDecorations />

      <div className="relative z-10 mx-auto w-full max-w-[1700px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        {/*
          Mobile: display:contents + max-lg:order-* restack panels.
          Desktop: DOM order is the visual order; flex-1 panels absorb height
          so both columns share equal bottom alignment without mid-column gaps.
        */}
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:items-stretch lg:gap-x-6 xl:gap-x-7">
          <div className="contents lg:flex lg:min-h-0 lg:min-w-0 lg:flex-col lg:gap-3">
            <div className="min-w-0 max-lg:order-1">
              <AuthBrandPanel />
            </div>
            <div className="min-w-0 max-lg:order-6">
              <AuthGovernancePillars />
            </div>
            <div className="min-w-0 max-lg:order-7">
              <AuthDakVisualPanel />
            </div>
            <div className="mt-0 flex min-w-0 flex-col gap-3 max-lg:order-8 lg:min-h-0 lg:flex-1">
              <div className="min-h-0 min-w-0 lg:flex-1">
                <AuthPortalBridgePanel />
              </div>
              <AuthPortalFooter />
            </div>
          </div>

          <div className="contents lg:flex lg:min-h-0 lg:min-w-0 lg:flex-col lg:gap-3">
            <div className="min-w-0 max-lg:order-2">{children}</div>
            <div className="min-w-0 max-lg:order-5">
              <AuthLoginAsidePanel />
            </div>
            <div className="min-w-0 max-lg:order-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
              <AuthWorkflowStatusPanel
                statusData={workflow.rows}
                unavailable={workflow.unavailable}
                fillHeight
              />
            </div>
            <div className="min-w-0 max-lg:order-3">
              <AuthDistrictGlancePanel data={glance} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
