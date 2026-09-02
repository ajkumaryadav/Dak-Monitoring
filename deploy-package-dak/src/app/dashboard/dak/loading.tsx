import { Skeleton } from "@/components/ui/skeleton";

export default function DakLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 w-full rounded-2xl bg-primary/10" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
