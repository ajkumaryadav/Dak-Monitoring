"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { mainNavItems } from "@/lib/constants/navigation";
import { hasPermission } from "@/lib/auth/permissions";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

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

interface SidebarNavProps {
  role: UserRole;
  onNavigate?: () => void;
}

export function SidebarNav({ role, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  const visibleItems = mainNavItems.filter((item) => {
    if (item.disabled) {
      return true;
    }

    if (!item.permission) {
      return true;
    }

    return hasPermission(role, item.permission);
  });

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
      {visibleItems.map((item) => {
        const isActive =
          !item.disabled && isNavItemActive(pathname, item.href);
        const Icon = item.icon;

        if (item.disabled) {
          return (
            <div
              key={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-60"
              aria-disabled="true"
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 truncate">{item.title}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Soon
              </Badge>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
