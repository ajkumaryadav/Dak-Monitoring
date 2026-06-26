import { Landmark } from "lucide-react";

import { SidebarLogout } from "@/components/layout/sidebar-logout";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { appConfig } from "@/lib/constants/navigation";
import type { SessionUser } from "@/types";

interface AppSidebarProps {
  user: SessionUser;
}

export function AppSidebar({ user }: AppSidebarProps) {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Landmark className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {appConfig.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {appConfig.shortName}
          </p>
        </div>
      </div>

      <SidebarNav role={user.role} />

      <div className="mt-auto border-t border-sidebar-border pt-2">
        <SidebarLogout />
      </div>

      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {appConfig.fullName}
        </p>
      </div>
    </aside>
  );
}
