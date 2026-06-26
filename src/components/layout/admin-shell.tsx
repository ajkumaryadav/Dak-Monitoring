"use client";

import { useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import type { SessionUser } from "@/types";

interface AdminShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-muted/30 dark:bg-background">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
