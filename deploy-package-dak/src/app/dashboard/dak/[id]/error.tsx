"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function DakDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="mx-auto max-w-lg border-destructive/20">
      <CardHeader>
        <CardTitle>Unable to load DAK details</CardTitle>
        <CardDescription>
          Something went wrong while fetching this correspondence record.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className={cn(buttonVariants(), "h-9 px-4")}
        >
          Try again
        </button>
        <Link
          href="/dashboard/dak"
          className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
        >
          Back to All DAK
        </Link>
      </CardContent>
    </Card>
  );
}
