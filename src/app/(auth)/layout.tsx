import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { AuthDecorations } from "@/features/auth/components/auth-decorations";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AuthBrandPanel />

      <div className="relative flex flex-1 flex-col overflow-hidden bg-muted/40 dark:bg-background">
        <AuthDecorations />
        <div className="relative z-10 flex justify-center px-6 pt-8 sm:px-10 sm:pt-10">
          <span className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-semibold tracking-wide text-primary uppercase">
            Collectorate Portal
          </span>
        </div>
        <div className="relative z-10 flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-lg">{children}</div>
        </div>
      </div>
    </div>
  );
}
