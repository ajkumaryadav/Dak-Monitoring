import { Download, ExternalLink, FileText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { formatFileSize } from "@/features/dak/lib/attachment-validation";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import {
  DOCUMENT_CATEGORY_LABELS,
  groupDakDocuments,
  type DocumentCategory,
} from "@/features/dak/lib/dak-journey";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import type { DakAtrRecord } from "@/features/remarks/services/get-remarks";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: DocumentCategory[] = [
  "original",
  "correspondence",
  "atr",
  "compliance",
  "other",
];

interface DakDocumentsPanelProps {
  attachments: DakAttachmentWithUrl[];
  atrRecords: DakAtrRecord[];
  className?: string;
}

export function DakDocumentsPanel({
  attachments,
  atrRecords,
  className,
}: DakDocumentsPanelProps) {
  const docs = groupDakDocuments({ attachments, atrRecords });

  return (
    <section
      className={cn(
        "flex max-h-72 flex-col overflow-hidden rounded-xl border bg-card p-3 shadow-sm sm:max-h-80 sm:p-4",
        className
      )}
    >
      <div className="shrink-0">
        <h2 className="text-sm font-bold">Documents</h2>
        <p className="text-[11px] text-muted-foreground">
          All uploaded files grouped by category
        </p>
      </div>

      {docs.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed px-3 py-5 text-center text-sm text-muted-foreground">
          No data available.
        </p>
      ) : (
        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
          {CATEGORY_ORDER.map((category) => {
            const items = docs.filter((d) => d.category === category);
            if (!items.length) return null;
            return (
              <div key={category}>
                <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {DOCUMENT_CATEGORY_LABELS[category]}
                  <span className="ml-1 tabular-nums">({items.length})</span>
                </p>
                <ul className="space-y-1.5">
                  {items.map((file) => (
                    <li
                      key={file.id}
                      className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/10 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">
                            {file.fileName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {file.uploadedBy ? `${file.uploadedBy} · ` : ""}
                            {formatDakDateTime(file.uploadedAt)}
                            {file.fileSize > 0
                              ? ` · ${formatFileSize(file.fileSize)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <a
                          href={file.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-7 gap-1 px-2 text-[11px]"
                          )}
                        >
                          <ExternalLink className="size-3" />
                          Preview
                        </a>
                        <a
                          href={file.downloadUrl}
                          download={file.fileName}
                          className={cn(
                            buttonVariants({ variant: "secondary", size: "sm" }),
                            "h-7 gap-1 px-2 text-[11px]"
                          )}
                        >
                          <Download className="size-3" />
                          Download
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
