import { getStorageConfig } from "@/lib/storage/config";
import { LocalStorageProvider } from "@/lib/storage/providers/local-storage-provider";
import type {
  StorageDownloadResult,
  StorageListOptions,
  StorageObjectMeta,
  StorageProvider,
  StorageUploadInput,
} from "@/lib/storage/types";

let cachedProvider: StorageProvider | null = null;

/** Resolve the configured storage provider (extensible factory). */
export function getStorageProvider(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  const config = getStorageConfig();

  switch (config.provider) {
    case "local":
      cachedProvider = new LocalStorageProvider(config.localRoot);
      break;
    case "minio":
    case "s3":
    case "azure":
    case "gcs":
      throw new Error(
        `Storage provider "${config.provider}" is not enabled yet. Use local storage.`
      );
    default:
      cachedProvider = new LocalStorageProvider(config.localRoot);
  }

  return cachedProvider;
}

/** Application-facing storage service — all modules must use this layer. */
export class StorageService {
  constructor(private readonly provider: StorageProvider = getStorageProvider()) {}

  get providerKind(): string {
    return this.provider.kind;
  }

  get defaultBucket(): string {
    return getStorageConfig().defaultBucket;
  }

  upload(input: Omit<StorageUploadInput, "bucket"> & { bucket?: string }) {
    return this.provider.upload({
      ...input,
      bucket: input.bucket ?? this.defaultBucket,
    });
  }

  download(path: string, bucket?: string): Promise<StorageDownloadResult> {
    return this.provider.download(bucket ?? this.defaultBucket, path);
  }

  remove(paths: string[], bucket?: string): Promise<void> {
    return this.provider.remove(bucket ?? this.defaultBucket, paths);
  }

  list(
    options?: StorageListOptions,
    bucket?: string
  ): Promise<StorageObjectMeta[]> {
    return this.provider.list(bucket ?? this.defaultBucket, options);
  }

  exists(path: string, bucket?: string): Promise<boolean> {
    return this.provider.exists(bucket ?? this.defaultBucket, path);
  }

  getSignedUrl(path: string, bucket?: string): Promise<string | null> {
    const ttl = getStorageConfig().signedUrlTtlSeconds;
    return this.provider.getSignedUrl(
      bucket ?? this.defaultBucket,
      path,
      ttl
    );
  }

  getUsage(bucket?: string) {
    return this.provider.getUsage(bucket ?? this.defaultBucket);
  }
}

export function createStorageService(): StorageService {
  return new StorageService();
}
