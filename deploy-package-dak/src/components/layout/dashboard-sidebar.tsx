"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, LogOut } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useCollectorAtr } from "@/features/dak/components/collector-atr-provider";
import { appConfig, getNavGroupsForRole } from "@/lib/constants/navigation";
import { hasPermission } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

const ATR_COMPLIANCE_HREF = "/dashboard/dak/atr-compliance";

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/dashboard/dak") {
    return (
      pathname === "/dashboard/dak" ||
      (pathname.startsWith("/dashboard/dak/") &&
        !pathname.startsWith("/dashboard/dak/new") &&
        !pathname.startsWith("/dashboard/dak/pending") &&
        !pathname.startsWith("/dashboard/dak/completed") &&
        !pathname.startsWith("/dashboard/dak/assignments") &&
        !pathname.startsWith("/dashboard/dak/atr-compliance") &&
        !pathname.startsWith("/dashboard/dak/pending-approval"))
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

interface DashboardSidebarProps {
  user: SessionUser;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const navGroups = getNavGroupsForRole(user.role);
  const collectorAtr = useCollectorAtr();

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r border-sidebar-border/80 bg-gradient-to-b from-[oklch(0.97_0.02_255)] via-sidebar to-[oklch(0.95_0.025_255)] dark:from-[oklch(0.18_0.03_255)] dark:via-sidebar dark:to-[oklch(0.16_0.025_255)]"
    >
      <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.32_0.12_255)] text-primary-foreground shadow-md shadow-primary/25">
            <Landmark className="size-5" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              {appConfig.name}
            </p>
            <p className="truncate text-[11px] font-medium text-muted-foreground">
              {appConfig.shortName}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 py-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.disabled) {
              return true;
            }
            if (!item.permission) {
              return true;
            }
            return hasPermission(user.role, item.permission);
          });

          if (visibleItems.length === 0) {
            return null;
          }

          return (
            <SidebarGroup key={group.label} className="px-1 py-1.5">
              <SidebarGroupLabel className="mb-1 px-3 text-[10px] font-bold tracking-[0.14em] text-primary/70 uppercase">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      !item.disabled && isNavItemActive(pathname, item.href);
                    const atrBadgeCount =
                      item.href === ATR_COMPLIANCE_HREF && collectorAtr
                        ? collectorAtr.unreadCount
                        : 0;

                    if (item.disabled) {
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            disabled
                            className="rounded-xl opacity-60"
                            tooltip={item.title}
                          >
                            <Icon />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                          <SidebarMenuBadge className="bg-muted text-[10px] text-muted-foreground">
                            Soon
                          </SidebarMenuBadge>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.title}
                          className={cn(
                            "h-10 rounded-xl border border-transparent px-3 font-medium transition-all duration-200",
                            "hover:translate-x-0.5 hover:border-primary/15 hover:bg-primary/8 hover:shadow-sm",
                            isActive &&
                              "border-primary/20 bg-primary/12 text-primary shadow-sm shadow-primary/10"
                          )}
                          render={<Link href={item.href} />}
                        >
                          <Icon
                            className={cn(
                              "size-4 shrink-0",
                              isActive ? "text-primary" : "text-primary/70"
                            )}
                          />
                          <span className="truncate">{item.title}</span>
                        </SidebarMenuButton>
                        {atrBadgeCount > 0 && (
                          <SidebarMenuBadge className="bg-emerald-600 text-[10px] font-bold text-white tabular-nums">
                            {atrBadgeCount > 99 ? "99+" : atrBadgeCount}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/auth/logout" prefetch={false} />}
              className="rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
              tooltip="Sign out"
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-2" />

        <p className="px-3 text-[10px] leading-relaxed font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
          {appConfig.districtAdministration}
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
