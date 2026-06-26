import { Label } from "@/components/ui/label";
import {
  ALLOWED_ATTACHMENT_ACCEPT,
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
} from "@/features/dak/lib/attachment-validation";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none",
  "file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary-foreground",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive dark:bg-input/30"
);

interface AttachmentUploadProps {
  error?: string;
}

export function AttachmentUpload({ error }: AttachmentUploadProps) {
  return (
    <div className="grid gap-2 md:col-span-2">
      <Label htmlFor="attachment">Attachment (optional)</Label>
      <input
        id="attachment"
        name="attachment"
        type="file"
        accept={ALLOWED_ATTACHMENT_ACCEPT}
        className={inputClassName}
        aria-invalid={!!error}
      />
      <p className="text-xs text-muted-foreground">
        PDF and DOCX up to {MAX_DOCUMENT_BYTES / (1024 * 1024)} MB · JPG/PNG up
        to {MAX_IMAGE_BYTES / (1024 * 1024)} MB
      </p>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
