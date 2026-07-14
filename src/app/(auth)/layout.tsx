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
          Mobile: wrappers use display:contents so order-* stacks panels.
          Desktop: two columns; mt-auto aligns bottom boxes without mid-column stretch.
          Login form is rendered once.
        */}
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:items-stretch lg:gap-x-6 xl:gap-x-7">
          <div className="contents lg:flex lg:h-full lg:min-w-0 lg:flex-col lg:gap-3">
            <div className="order-1 min-w-0">
              <AuthBrandPanel />
            </div>
            <div className="order-6 min-w-0">
              <AuthGovernancePillars />
            </div>
            <div className="order-7 min-w-0">
              <AuthDakVisualPanel />
            </div>
            <div className="order-8 mt-0 flex min-w-0 flex-col gap-3 lg:min-h-0 lg:flex-1">
              <div className="min-h-0 min-w-0 lg:flex-1">
                <AuthPortalBridgePanel />
              </div>
              <AuthPortalFooter />
            </div>
          </div>

          <div className="contents lg:flex lg:h-full lg:min-w-0 lg:flex-col lg:gap-3">
            <div className="order-2 min-w-0">{children}</div>
            <div className="order-5 min-w-0">
              <AuthLoginAsidePanel />
            </div>
            <div className="order-4 min-w-0">
              <AuthWorkflowStatusPanel
                statusData={workflow.rows}
                unavailable={workflow.unavailable}
              />
            </div>
            <div className="order-3 min-w-0 lg:mt-auto">
              <AuthDistrictGlancePanel data={glance} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
