"use client";

import { Bell } from "lucide-react";

import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { appConfig } from "@/lib/constants/navigation";
import type { SessionUser } from "@/types";

interface TopNavbarProps {
  user: SessionUser;
}

export function TopNavbar({ user }: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:gap-4 md:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight">
          {appConfig.fullName}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          Collectorate Administration Portal
        </p>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          disabled
          aria-label="Notifications (coming soon)"
        >
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
        </Button>

        <UserMenu user={user} />
      </div>
    </header>
  );
}
