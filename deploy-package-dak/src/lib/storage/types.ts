/** Provider-agnostic storage contracts for DAK Monitoring. */

export interface StorageObjectMeta {
  path: string;
  size: number;
  contentType?: string | null;
  updatedAt?: string | null;
}

export interface StorageUploadInput {
  bucket: string;
  path: string;
  data: Buffer | Uint8Array;
  contentType?: string;
  upsert?: boolean;
}

export interface StorageDownloadResult {
  data: Buffer;
  contentType?: string | null;
}

export interface StorageListOptions {
  prefix?: string;
  limit?: number;
}

/** Pluggable storage backend — Supabase today; MinIO/S3/Azure/GCS later. */
export interface StorageProvider {
  readonly kind: string;
  upload(input: StorageUploadInput): Promise<{ path: string }>;
  download(bucket: string, path: string): Promise<StorageDownloadResult>;
  remove(bucket: string, paths: string[]): Promise<void>;
  list(
    bucket: string,
    options?: StorageListOptions
  ): Promise<StorageObjectMeta[]>;
  exists(bucket: string, path: string): Promise<boolean>;
  getSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number
  ): Promise<string | null>;
  getUsage(
    bucket: string
  ): Promise<{ fileCount: number; totalBytes: number }>;
}
