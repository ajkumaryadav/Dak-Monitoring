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

export default function DakNotFound() {
  return (
    <Card className="mx-auto max-w-lg border-primary/15">
      <CardHeader>
        <CardTitle>DAK not found</CardTitle>
        <CardDescription>
          This correspondence record does not exist or may have been removed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/dashboard/dak"
          className={cn(buttonVariants(), "h-9 px-4")}
        >
          Back to All DAK
        </Link>
      </CardContent>
    </Card>
  );
}
