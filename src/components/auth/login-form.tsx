"use client";

import { Loader2 } from "lucide-react";
import { startTransition, useActionState, useRef, useState } from "react";

import {
  loginAction,
  type LoginFormState,
} from "@/app/(auth)/login/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LoginBrandTitle } from "@/features/auth/components/login-brand-title";
import { encryptCredentialsClient } from "@/lib/security/credential-crypto";
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
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || isEncrypting) return;

    try {
      setIsEncrypting(true);
      const encrypted = await encryptCredentialsClient({
        email: emailValue,
        password: passwordValue,
      });

      const formData = new FormData();
      formData.append("encrypted_payload", encrypted);

      startTransition(() => {
        formAction(formData);
      });
    } catch (err) {
      console.error("[Login Security] Encryption error:", err);
    } finally {
      setIsEncrypting(false);
    }
  }

  const busy = isPending || isEncrypting;

  return (
    <Card className="w-full border-primary/20 bg-card/95 shadow-2xl backdrop-blur-sm">
      <CardHeader className="space-y-2 border-b border-border/50 bg-primary/[0.04] pb-4 text-center">
        <LoginBrandTitle />
        <p className="text-xs text-muted-foreground">
          Government of Rajasthan · Secure Official Access
        </p>
      </CardHeader>

      <CardContent>
        <form
          ref={formRef}
          method="POST"
          action="/login"
          onSubmit={handleSubmit}
          autoComplete="off"
          data-testid="login-form"
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="login_identity">Official Email / User ID</Label>
            <input
              id="login_identity"
              type="text"
              className={inputClassName}
              placeholder="Enter official email or username"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              aria-invalid={!!state.errors?.email}
              required
            />
            {state.errors?.email?.[0] && (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="login_secret">Password</Label>
            <input
              id="login_secret"
              type="password"
              className={inputClassName}
              placeholder="Enter secure password"
              autoComplete="current-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              aria-invalid={!!state.errors?.password}
              required
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
            disabled={busy}
            className={cn(buttonVariants(), "h-10 w-full")}
          >
            {busy ? (
              <>
                <Loader2 className="animate-spin" />
                Securing & Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Zero-exposure encrypted authentication · Access is monitored and logged.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
