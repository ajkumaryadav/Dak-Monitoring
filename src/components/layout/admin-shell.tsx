"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import type { SessionUser } from "@/types";

interface AdminShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar user={user} />
      <SidebarInset className="flex min-h-svh flex-col">
        <TopNavbar user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/30 dark:bg-background">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
