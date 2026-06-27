"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, UserCheck, UserX } from "lucide-react";

import { resetPasswordFormAction } from "@/features/users/actions/reset-password";
import { toggleUserActiveAction } from "@/features/users/actions/toggle-user-active";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface UserActionsPanelProps {
  userId: string;
  isActive: boolean;
}

export function UserActionsPanel({ userId, isActive }: UserActionsPanelProps) {
  const router = useRouter();
  const [isToggling, startToggle] = useTransition();
  const [resetState, resetAction, isResetting] = useActionState(
    resetPasswordFormAction,
    {}
  );

  function handleToggle(nextActive: boolean) {
    startToggle(async () => {
      await toggleUserActiveAction(userId, nextActive);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 rounded-xl border bg-muted/20 p-5">
      <div>
        <h3 className="text-sm font-semibold">Account Actions</h3>
        <p className="text-xs text-muted-foreground">
          Reset password or change account availability.
        </p>
      </div>

      <form action={resetAction} className="space-y-3 rounded-lg border bg-background p-4">
        <input type="hidden" name="userId" value={userId} />
        <Label htmlFor="password">Reset Password</Label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          placeholder="New password (min 8 chars)"
          className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
        />
        {resetState.message && (
          <p className={cn("text-xs", resetState.success ? "text-emerald-600" : "text-destructive")}>
            {resetState.message}
          </p>
        )}
        <button
          type="submit"
          disabled={isResetting}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          {isResetting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          Reset Password
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {isActive ? (
          <button
            type="button"
            disabled={isToggling}
            onClick={() => handleToggle(false)}
            className={cn(buttonVariants({ variant: "destructive", size: "sm" }), "gap-1.5")}
          >
            {isToggling ? <Loader2 className="size-4 animate-spin" /> : <UserX className="size-4" />}
            Disable User
          </button>
        ) : (
          <button
            type="button"
            disabled={isToggling}
            onClick={() => handleToggle(true)}
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            {isToggling ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
            Enable User
          </button>
        )}
      </div>
    </div>
  );
}
