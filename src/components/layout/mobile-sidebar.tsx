"use client";

import { Landmark } from "lucide-react";

import { SidebarLogout } from "@/components/layout/sidebar-logout";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { appConfig } from "@/lib/constants/navigation";
import type { SessionUser } from "@/types";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SessionUser;
}

export function MobileSidebar({ open, onOpenChange, user }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-72 flex-col bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-sidebar-foreground">
                {appConfig.name}
              </SheetTitle>
              <SheetDescription>{appConfig.shortName}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <SidebarNav role={user.role} onNavigate={() => onOpenChange(false)} />
        <div className="mt-auto border-t border-sidebar-border pt-2">
          <SidebarLogout />
        </div>
      </SheetContent>
    </Sheet>
  );
}
