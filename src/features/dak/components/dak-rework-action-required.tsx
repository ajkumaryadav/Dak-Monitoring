import { ClipboardList } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ACTION_ITEMS = [
  "Update Action Taken Summary",
  "Upload Revised ATR",
  "Upload Additional Supporting Documents (if required)",
  "Submit Revised Compliance",
] as const;

/** Checklist shown below the rework banner so officers know exactly what to do. */
export function DakReworkActionRequired() {
  return (
    <Card className="border-primary/20">
      <CardHeader className="border-b border-border/60 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="size-4 text-primary" />
          Action Required
        </CardTitle>
        <CardDescription>
          Complete the following before resubmitting to the Collector
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-2">
          {ACTION_ITEMS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-foreground"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
