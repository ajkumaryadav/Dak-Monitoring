"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { KeyRound, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

interface UserMenuProps {
  user: SessionUser;
}

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
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const closeTimer = window.setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 0);

    document.addEventListener("keydown", handleEscape);

    return () => {
      window.clearTimeout(closeTimer);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
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

      {open && (
        <div
          role="menu"
          aria-label="User account menu"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-[200] w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
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
            <User className="size-4 shrink-0" />
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
            <Settings className="size-4 shrink-0" />
            Settings
          </Link>

          <Link
            href="/dashboard/profile#change-password"
            role="menuitem"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm",
              "hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => setOpen(false)}
          >
            <KeyRound className="size-4 shrink-0" />
            Change Password
          </Link>

          <div className="my-1 h-px bg-border" />

          <Link
            href="/auth/logout"
            prefetch={false}
            role="menuitem"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive",
              "hover:bg-destructive/10"
            )}
            onClick={() => setOpen(false)}
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </Link>
        </div>
      )}
    </div>
  );
}
