import { Landmark, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { appConfig } from "@/lib/constants/navigation";
import type { SessionUser } from "@/types";

interface DashboardHeroProps {
  user: SessionUser;
  title: string;
  description: string;
}

export function DashboardHero({ user, title, description }: DashboardHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary via-primary to-[oklch(0.32_0.1_255)] px-6 py-6 text-primary-foreground shadow-lg shadow-primary/15 md:px-8 md:py-7">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent, transparent 16px, currentColor 16px, currentColor 17px)",
        }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
            <Landmark className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.15em] text-primary-foreground/70 uppercase">
              {appConfig.districtAdministration}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-primary-foreground/80">
              Welcome back,{" "}
              <span className="font-medium text-primary-foreground">
                {user.name}
              </span>
              . {description}
            </p>
          </div>
        </div>
        <Badge className="w-fit border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground capitalize hover:bg-primary-foreground/15">
          <Sparkles className="size-3" />
          {user.role.replace(/_/g, " ")}
        </Badge>
      </div>
    </div>
  );
}
