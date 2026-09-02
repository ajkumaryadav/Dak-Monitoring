import type { LucideIcon } from "lucide-react";

interface DakPageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function DakPageHeader({
  title,
  description,
  icon: Icon,
}: DakPageHeaderProps) {
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
      <div className="relative flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
          <Icon className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-primary-foreground/80">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
