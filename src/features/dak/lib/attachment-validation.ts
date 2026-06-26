/** Allowed attachment extensions for DAK correspondence. */
export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".doc",
  ".docx",
] as const;

export const ALLOWED_ATTACHMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.doc,.docx";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

/** Max file size: 10 MB for PDF/DOCX, 5 MB for images. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXTENSION_MIME_MAP: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) {
    return "";
  }

  return fileName.slice(dotIndex).toLowerCase();
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getMaxBytesForExtension(extension: string): number {
  return IMAGE_EXTENSIONS.has(extension)
    ? MAX_IMAGE_BYTES
    : MAX_DOCUMENT_BYTES;
}

export function validateAttachmentFile(
  file: File
): { valid: true } | { valid: false; message: string } {
  const extension = getFileExtension(file.name);

  if (
    !ALLOWED_ATTACHMENT_EXTENSIONS.includes(
      extension as (typeof ALLOWED_ATTACHMENT_EXTENSIONS)[number]
    )
  ) {
    return {
      valid: false,
      message: "Only PDF, JPG, PNG, DOC, and DOCX files are allowed.",
    };
  }

  const maxBytes = getMaxBytesForExtension(extension);

  if (file.size > maxBytes) {
    const limitMb = maxBytes / (1024 * 1024);
    return {
      valid: false,
      message: `File exceeds the ${limitMb} MB size limit for this file type.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, message: "The selected file is empty." };
  }

  const allowedMimes = EXTENSION_MIME_MAP[extension] ?? [];

  if (file.type && !allowedMimes.includes(file.type)) {
    return {
      valid: false,
      message: "File type does not match the selected extension.",
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
