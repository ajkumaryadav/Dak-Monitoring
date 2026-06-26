"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-lg border-destructive/30">
      <CardHeader>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-5" />
          <CardTitle>Unable to load dashboard</CardTitle>
        </div>
        <CardDescription>
          An unexpected error occurred while loading the dashboard. Please try
          again or contact the system administrator.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" render={<Link href="/login" />}>
          Back to login
        </Button>
      </CardContent>
    </Card>
  );
}
