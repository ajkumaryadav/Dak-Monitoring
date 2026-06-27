import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { AuthDecorations } from "@/features/auth/components/auth-decorations";
import { AuthPortalFooter } from "@/features/auth/components/auth-portal-footer";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-background lg:flex-row">
      <AuthBrandPanel />

      <div className="relative flex flex-1 flex-col overflow-hidden bg-muted/30 dark:bg-background">
        <AuthDecorations />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-lg">{children}</div>
          <AuthPortalFooter />
        </div>
      </div>
    </div>
  );
}
