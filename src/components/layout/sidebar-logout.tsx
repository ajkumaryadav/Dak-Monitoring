"use client";

import { LogOut } from "lucide-react";

import { logoutAction } from "@/features/auth/actions/logout";
import { cn } from "@/lib/utils";

export function SidebarLogout() {
  return (
    <form action={logoutAction} className="px-3 pb-2">
      <button
        type="submit"
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
        )}
      >
        <LogOut className="size-4 shrink-0" />
        <span>Logout</span>
      </button>
    </form>
  );
}
