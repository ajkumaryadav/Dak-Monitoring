"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, LogOut } from "lucide-react";

import { logoutAction } from "@/features/auth/actions/logout";
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
import { appConfig, getNavGroupsForRole } from "@/lib/constants/navigation";
import { hasPermission } from "@/lib/auth/permissions";
import type { SessionUser } from "@/types";

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
        !pathname.startsWith("/dashboard/dak/assignments"))
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

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <Landmark className="size-5" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
              {appConfig.name}
            </p>
            <p className="truncate text-xs font-medium text-muted-foreground">
              {appConfig.shortName}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1 py-3">
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
            <SidebarGroup key={group.label} className="px-2 py-1">
              <SidebarGroupLabel className="px-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      !item.disabled && isNavItemActive(pathname, item.href);

                    if (item.disabled) {
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            disabled
                            className="opacity-60"
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
                          render={<Link href={item.href} />}
                        >
                          <Icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={logoutAction} className="w-full">
              <SidebarMenuButton
                type="submit"
                className="text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
                tooltip="Sign out"
              >
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-2" />

        <p className="px-2 text-[11px] leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
          {appConfig.districtAdministration}
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
