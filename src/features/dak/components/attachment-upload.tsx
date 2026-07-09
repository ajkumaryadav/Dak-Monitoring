"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import {
  ALLOWED_ATTACHMENT_ACCEPT,
  MAX_UPLOAD_BYTES,
  validateAttachmentFile,
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
  const [clientError, setClientError] = useState<string | null>(null);
  const displayError = error ?? clientError;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setClientError(null);
      return;
    }

    const validation = validateAttachmentFile(file);
    setClientError(validation.valid ? null : validation.message);
  }

  return (
    <div className="grid gap-2 md:col-span-2">
      <Label htmlFor="attachment">Attachment (optional)</Label>
      <input
        id="attachment"
        name="attachment"
        type="file"
        accept={ALLOWED_ATTACHMENT_ACCEPT}
        onChange={handleFileChange}
        className={inputClassName}
        aria-invalid={!!displayError}
      />
      <p className="text-xs text-muted-foreground">
        PDF, Word, Excel, PowerPoint, TXT, JPG, PNG, ZIP (max{" "}
        {MAX_UPLOAD_BYTES / (1024 * 1024)} MB). Images up to 5 MB.
      </p>
      {displayError && (
        <p className="text-sm text-destructive" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
