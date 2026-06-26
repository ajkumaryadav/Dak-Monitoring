import { Skeleton } from "@/components/ui/skeleton";

export default function DakDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-40 rounded-lg" />
      <Skeleton className="h-36 w-full rounded-2xl bg-primary/10" />
      <div className="grid gap-5 lg:grid-cols-5">
        <Skeleton className="h-[420px] rounded-xl lg:col-span-3" />
        <Skeleton className="h-[420px] rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}
