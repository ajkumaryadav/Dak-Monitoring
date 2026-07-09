/** Secure file upload validation for DAK correspondence attachments. */

export const UNSUPPORTED_FILE_TYPE_MESSAGE =
  "Unsupported or potentially unsafe file type. Please upload only approved office document formats.";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".zip",
] as const;

export const ALLOWED_ATTACHMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".msi",
  ".bat",
  ".cmd",
  ".com",
  ".scr",
  ".ps1",
  ".vbs",
  ".js",
  ".jar",
  ".dll",
  ".apk",
  ".iso",
  ".reg",
  ".sh",
  ".php",
  ".asp",
  ".aspx",
  ".cgi",
  ".avi",
  ".mp4",
  ".mov",
  ".wmv",
  ".mkv",
  ".flv",
  ".mpeg",
  ".mpg",
  ".3gp",
  ".webm",
  ".m4v",
]);

const EXTENSION_MIME_MAP: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  ".txt": ["text/plain"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".zip": ["application/zip", "application/x-zip-compressed"],
};

export function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) {
    return "";
  }

  return fileName.slice(dotIndex).toLowerCase();
}

/** All dotted extensions in a filename (e.g. letter.pdf.exe → [".pdf", ".exe"]). */
export function getExtensionChain(fileName: string): string[] {
  const parts = fileName.toLowerCase().split(".");
  if (parts.length < 2) {
    return [];
  }

  return parts.slice(1).map((part) => `.${part}`);
}

export function hasBlockedExtension(fileName: string): boolean {
  return getExtensionChain(fileName).some((ext) => BLOCKED_EXTENSIONS.has(ext));
}

export function sanitizeFileName(fileName: string): string {
  const baseName = fileName.replace(/\\/g, "/").split("/").pop() ?? fileName;
  return baseName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
}

export function getMaxBytesForExtension(extension: string): number {
  if (IMAGE_EXTENSIONS.has(extension)) {
    return 5 * 1024 * 1024;
  }

  return MAX_UPLOAD_BYTES;
}

export function validateAttachmentFile(
  file: File
): { valid: true } | { valid: false; message: string } {
  if (file.size === 0) {
    return { valid: false, message: "The selected file is empty." };
  }

  if (hasBlockedExtension(file.name)) {
    return { valid: false, message: UNSUPPORTED_FILE_TYPE_MESSAGE };
  }

  const extension = getFileExtension(file.name);

  if (
    !extension ||
    !ALLOWED_ATTACHMENT_EXTENSIONS.includes(
      extension as (typeof ALLOWED_ATTACHMENT_EXTENSIONS)[number]
    )
  ) {
    return { valid: false, message: UNSUPPORTED_FILE_TYPE_MESSAGE };
  }

  const maxBytes = getMaxBytesForExtension(extension);

  if (file.size > maxBytes) {
    const limitMb = maxBytes / (1024 * 1024);
    return {
      valid: false,
      message: `File exceeds the ${limitMb} MB size limit for this file type.`,
    };
  }

  const allowedMimes = EXTENSION_MIME_MAP[extension] ?? [];

  if (file.type && allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
    return { valid: false, message: UNSUPPORTED_FILE_TYPE_MESSAGE };
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
