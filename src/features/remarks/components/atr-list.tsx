import Link from "next/link";
import { Download } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import type { DakAtrRecord } from "@/features/remarks/services/get-remarks";
import { cn } from "@/lib/utils";

interface AtrListProps {
  atrRecords: DakAtrRecord[];
}

/** List of submitted Action Taken Reports for a DAK. */
export function AtrList({ atrRecords }: AtrListProps) {
  if (!atrRecords.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No Action Taken Report has been submitted for this DAK.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {atrRecords.map((atr) => (
        <li
          key={atr.id}
          className="rounded-lg border border-border/60 bg-muted/20 p-4"
        >
          <p className="text-xs text-muted-foreground">
            {formatDakDateTime(atr.submittedAt)}
            {atr.submitterName ? ` · ${atr.submitterName}` : ""}
            {atr.submitterRole
              ? ` (${atr.submitterRole.replace(/_/g, " ")})`
              : ""}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm">{atr.actionTaken}</p>
          {atr.attachmentFileName && atr.attachmentDownloadUrl && (
            <Link
              href={atr.attachmentDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3 gap-1.5"
              )}
            >
              <Download className="size-3.5" />
              {atr.attachmentFileName}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
