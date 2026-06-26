"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mainNavItems } from "@/lib/constants/navigation";

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
      {mainNavItems.map((item) => {
        const isActive =
          !item.disabled &&
          (item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`));
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
