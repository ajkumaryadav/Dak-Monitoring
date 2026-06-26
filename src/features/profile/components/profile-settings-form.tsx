"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  updateProfileAction,
  type UpdateProfileState,
} from "@/features/profile/actions/update-profile";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

const inputClassName = cn(
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive dark:bg-input/30"
);

const initialState: UpdateProfileState = {};

interface ProfileSettingsFormProps {
  user: SessionUser;
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={user.name}
          className={inputClassName}
          aria-invalid={!!state.errors?.name}
        />
        {state.errors?.name?.[0] && (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="designation">Designation</Label>
        <input
          id="designation"
          name="designation"
          type="text"
          defaultValue={user.designation}
          className={inputClassName}
          aria-invalid={!!state.errors?.designation}
        />
        {state.errors?.designation?.[0] && (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.designation[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Official Email</Label>
        <input
          id="email"
          type="email"
          value={user.email}
          readOnly
          disabled
          className={cn(inputClassName, "cursor-not-allowed opacity-70")}
        />
        <p className="text-xs text-muted-foreground">
          Email is managed by your administrator and cannot be changed here.
        </p>
      </div>

      {state.message && (
        <p
          className={cn(
            "rounded-md px-3 py-2 text-sm",
            state.success
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive"
          )}
          role="alert"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants(), "h-10")}
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Saving...
          </>
        ) : (
          "Save changes"
        )}
      </button>
    </form>
  );
}
