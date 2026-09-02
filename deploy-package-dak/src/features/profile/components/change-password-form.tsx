"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/features/profile/actions/change-password";
import {
  getPasswordStrength,
  PASSWORD_MIN_LENGTH,
} from "@/features/profile/schemas/change-password-schema";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive dark:bg-input/30"
);

const strengthColors: Record<string, string> = {
  Weak: "bg-destructive",
  Fair: "bg-amber-500",
  Good: "bg-sky-500",
  Strong: "bg-emerald-500",
};

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState
  );
  const [newPassword, setNewPassword] = useState("");

  const strength = useMemo(
    () => (newPassword ? getPasswordStrength(newPassword) : null),
    [newPassword]
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClassName}
          aria-invalid={Boolean(state.errors?.currentPassword)}
        />
        {state.errors?.currentPassword?.[0] && (
          <p className="text-sm text-destructive">{state.errors.currentPassword[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          className={inputClassName}
          aria-invalid={Boolean(state.errors?.newPassword)}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        {strength && newPassword.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  strengthColors[strength.label]
                )}
                style={{ width: `${(strength.score / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Strength:{" "}
              <span className="font-medium text-foreground">{strength.label}</span>
            </p>
          </div>
        )}
        {state.errors?.newPassword?.[0] && (
          <p className="text-sm text-destructive">{state.errors.newPassword[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          className={inputClassName}
          aria-invalid={Boolean(state.errors?.confirmPassword)}
        />
        {state.errors?.confirmPassword?.[0] && (
          <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
        )}
      </div>

      {state.message && !state.success && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      {state.success && state.message && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants(), "h-10 px-6")}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Updating…
          </>
        ) : (
          "Change Password"
        )}
      </button>
    </form>
  );
}
