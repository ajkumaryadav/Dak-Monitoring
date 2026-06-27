import { Badge } from "@/components/ui/badge";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import { getRemarkTypeLabel } from "@/features/remarks/lib/remark-types";
import type { DakRemarkRecord } from "@/features/remarks/services/get-remarks";

interface RemarkListProps {
  remarks: DakRemarkRecord[];
}

/** Chronological list of DAK remarks and internal notes. */
export function RemarkList({ remarks }: RemarkListProps) {
  if (!remarks.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No remarks recorded yet.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {remarks.map((remark) => (
        <li
          key={remark.id}
          className="rounded-lg border border-border/60 bg-muted/20 p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {getRemarkTypeLabel(remark.remarkType)}
            </Badge>
            {isInternalRemark(remark.remarkType) && (
              <Badge variant="secondary" className="text-xs">
                Internal
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDakDateTime(remark.createdAt)}
              {remark.authorName ? ` · ${remark.authorName}` : ""}
              {remark.authorRole
                ? ` (${remark.authorRole.replace(/_/g, " ")})`
                : ""}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{remark.body}</p>
        </li>
      ))}
    </ul>
  );
}

function isInternalRemark(
  type: DakRemarkRecord["remarkType"]
): boolean {
  return type === "internal_note" || type === "collector_note";
}
