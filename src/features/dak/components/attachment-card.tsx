import { FileText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatFileSize } from "@/features/dak/lib/attachment-validation";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import { cn } from "@/lib/utils";

interface AttachmentCardProps {
  attachments: DakAttachmentWithUrl[];
  embedded?: boolean;
  scrollable?: boolean;
  maxHeightClassName?: string;
}

function AttachmentList({ attachments }: { attachments: DakAttachmentWithUrl[] }) {
  if (!attachments.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No attachments uploaded for this entry.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <a
            href={attachment.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 hover:text-primary"
          >
            <span aria-hidden>📄</span>
            <span className="min-w-0 flex-1 truncate font-medium">
              {attachment.file_name}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatFileSize(attachment.file_size)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function AttachmentCard({
  attachments,
  embedded = false,
  scrollable = false,
  maxHeightClassName = "max-h-64",
}: AttachmentCardProps) {
  const list = (
    <div className={cn(scrollable && `${maxHeightClassName} overflow-y-auto pr-1`)}>
      <AttachmentList attachments={attachments} />
    </div>
  );

  if (embedded) {
    return list;
  }

  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.03] via-background to-background">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="size-4" />
          </div>
          <div>
            <CardTitle>Attachments</CardTitle>
            <CardDescription>
              Supporting documents linked to this DAK
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">{list}</CardContent>
    </Card>
  );
}
