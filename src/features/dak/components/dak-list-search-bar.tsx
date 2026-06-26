import { Suspense } from "react";

import { DakSearchForm } from "@/features/dak/components/dak-search-form";

function SearchSkeleton() {
  return (
    <div className="h-9 w-full max-w-md animate-pulse rounded-lg bg-muted/50" />
  );
}

interface DakListSearchBarProps {
  basePath: string;
}

/** Search bar for DAK list pages only — not shown on dashboard or register forms. */
export function DakListSearchBar({ basePath }: DakListSearchBarProps) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <DakSearchForm basePath={basePath} className="w-full max-w-md" />
    </Suspense>
  );
}
