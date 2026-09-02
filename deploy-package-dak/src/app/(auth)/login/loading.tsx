import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Skeleton className="mx-auto size-12 rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
