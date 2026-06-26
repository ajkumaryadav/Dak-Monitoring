"use client";

import { FormEvent, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DakSearchFormProps {
  /** List page path, e.g. /dashboard/dak/pending */
  basePath: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}

export function DakSearchForm({
  basePath,
  className,
  inputClassName,
  autoFocus = false,
}: DakSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const query = searchParams.get("q") ?? "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const q = String(formData.get("q") ?? "").trim();
    const url = q
      ? `${basePath}?q=${encodeURIComponent(q)}`
      : basePath;

    startTransition(() => {
      router.push(url);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        key={query}
        defaultValue={query}
        placeholder="Search DAK number, subject, sender…"
        className={cn("pl-9", inputClassName)}
        autoFocus={autoFocus}
        disabled={isPending}
        aria-label="Search DAK"
      />
    </form>
  );
}
