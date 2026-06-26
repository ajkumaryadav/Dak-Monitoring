"use client";

import { Landmark, Loader2 } from "lucide-react";
import { useActionState } from "react";

import {
  loginAction,
  type LoginFormState,
} from "@/app/(auth)/login/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { appConfig } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive dark:bg-input/30"
);

const initialState: LoginFormState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <Card className="w-full max-w-md border-border/60 shadow-xl">
      <CardHeader className="space-y-4 pb-2 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
          <Landmark className="size-7" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">Sign in to {appConfig.shortName}</CardTitle>
          <CardDescription>{appConfig.districtAdministration}</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Official Email</Label>
            <input
              id="email"
              name="email"
              type="email"
              className={inputClassName}
              placeholder="name@collectorate.gov.in"
              autoComplete="email"
              aria-invalid={!!state.errors?.email}
            />
            {state.errors?.email?.[0] && (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <input
              id="password"
              name="password"
              type="password"
              className={inputClassName}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={!!state.errors?.password}
            />
            {state.errors?.password?.[0] && (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          {state.message && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={cn(buttonVariants(), "h-10 w-full")}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in to Portal"
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Authorized personnel only. All access is monitored and logged.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
