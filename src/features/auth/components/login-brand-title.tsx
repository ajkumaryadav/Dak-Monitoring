import { Landmark } from "lucide-react";

import { appConfig } from "@/lib/constants/navigation";

export function LoginBrandTitle() {
  return (
    <div className="flex flex-col items-center gap-4 pt-1">
      <div className="relative">
        <div
          className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/40 via-violet-500/30 to-emerald-500/40 blur-md"
          aria-hidden
        />
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-violet-600 to-emerald-600 shadow-lg shadow-primary/25">
          <Landmark className="size-8 text-white drop-shadow-sm" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-center text-[1.65rem] leading-tight font-bold tracking-tight sm:text-[1.85rem]">
          <span className="bg-gradient-to-r from-primary via-violet-600 to-sky-600 bg-clip-text text-transparent">
            {appConfig.name}
          </span>
        </h1>
        <p className="max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
          {appConfig.fullName}
        </p>

        <div className="flex items-center justify-center gap-2">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/50" />
          <span className="rounded-full bg-gradient-to-r from-primary/10 via-violet-500/10 to-emerald-500/10 px-3 py-0.5 text-[10px] font-semibold tracking-[0.2em] text-primary uppercase ring-1 ring-primary/15">
            Collectorate Portal
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-emerald-500/50" />
        </div>
      </div>
    </div>
  );
}
