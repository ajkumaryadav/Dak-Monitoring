import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { AuthDakVisualPanel } from "@/features/auth/components/auth-dak-visual-panel";
import { AuthDecorations } from "@/features/auth/components/auth-decorations";
import { AuthPortalFooter } from "@/features/auth/components/auth-portal-footer";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-background">
      <div className="flex flex-1 flex-col lg:flex-row">
        <AuthBrandPanel />

        <div className="relative flex flex-1 flex-col overflow-hidden bg-muted/30 dark:bg-background">
          <AuthDecorations />
          <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-8 lg:items-end lg:justify-start lg:p-10">
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
              {children}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full border-t border-border/50 bg-muted/30 px-6 pt-4 pb-5 dark:bg-background sm:px-8 sm:pt-5 sm:pb-6 lg:px-10">
        <div className="mx-auto w-full max-w-7xl space-y-3">
          <AuthDakVisualPanel />
          <AuthPortalFooter />
        </div>
      </div>
    </div>
  );
}
