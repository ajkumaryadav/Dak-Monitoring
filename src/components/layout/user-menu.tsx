"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, Settings, User } from "lucide-react";

import { logoutAction } from "@/features/auth/actions/logout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

interface UserMenuProps {
  user: SessionUser;
}

const MENU_WIDTH = 224;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setMenuStyle({
        top: rect.bottom + 8,
        left: Math.max(8, rect.right - MENU_WIDTH),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      aria-label="User account menu"
      style={{ top: menuStyle.top, left: menuStyle.left, width: MENU_WIDTH }}
      className="fixed z-[200] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
    >
      <div className="px-2 py-2">
        <p className="text-sm font-medium text-foreground">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        <Badge variant="secondary" className="mt-2 capitalize">
          {user.role.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="my-1 h-px bg-border" />

      <Link
        href="/dashboard/profile"
        role="menuitem"
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm",
          "hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => setOpen(false)}
      >
        <User className="size-4" />
        Profile
      </Link>

      <Link
        href="/dashboard/settings"
        role="menuitem"
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm",
          "hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => setOpen(false)}
      >
        <Settings className="size-4" />
        Settings
      </Link>

      <div className="my-1 h-px bg-border" />

      <form action={logoutAction}>
        <button
          type="submit"
          role="menuitem"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive",
            "hover:bg-destructive/10"
          )}
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </form>
    </div>
  ) : null;

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        className="h-auto gap-2 px-2 py-1.5"
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.designation}</p>
        </div>
      </Button>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
