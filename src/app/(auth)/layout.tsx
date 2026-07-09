import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { AuthDakVisualPanel } from "@/features/auth/components/auth-dak-visual-panel";
import { AuthDecorations } from "@/features/auth/components/auth-decorations";
import { AuthDistrictGlancePanel } from "@/features/auth/components/auth-district-glance-panel";
import { AuthFeatureCards } from "@/features/auth/components/auth-feature-cards";
import { AuthGovernancePillars } from "@/features/auth/components/auth-governance-pillars";
import { AuthLoginAsidePanel } from "@/features/auth/components/auth-login-aside-panel";
import { AuthPortalFooter } from "@/features/auth/components/auth-portal-footer";
import { AuthWorkflowStatusPanel } from "@/features/auth/components/auth-workflow-status-panel";
import { fetchPortalWorkflowStats } from "@/features/auth/services/portal-workflow-stats";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const workflowStats = await fetchPortalWorkflowStats();

  return (
    <div className="auth-portal-shell relative min-h-screen overflow-x-hidden">
      <div className="auth-portal-bg pointer-events-none absolute inset-0" aria-hidden />
      <AuthDecorations />

      <div className="relative z-10 mx-auto w-full max-w-[1700px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 xl:py-7">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] lg:gap-7 xl:gap-8">
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            <AuthBrandPanel />
            <AuthFeatureCards />
            <AuthGovernancePillars />
            <AuthDakVisualPanel />
            <AuthPortalFooter />
          </div>

          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            {children}
            <AuthLoginAsidePanel />
            <AuthWorkflowStatusPanel statusData={workflowStats} />
            <AuthDistrictGlancePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
