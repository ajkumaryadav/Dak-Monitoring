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

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/40 p-6 sm:p-10 dark:bg-background">
        <AuthDecorations />
        <div className="relative z-10 w-full max-w-lg">{children}</div>
      </div>
    </div>
  );
}
