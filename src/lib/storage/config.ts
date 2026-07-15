/** Storage provider configuration — never hard-code paths in business logic. */

export type StorageProviderKind =
  | "supabase"
  | "local"
  | "minio"
  | "s3"
  | "azure"
  | "gcs";

export interface StorageConfig {
  provider: StorageProviderKind;
  /** Default attachment bucket / root folder name. */
  defaultBucket: string;
  /** Local filesystem root when provider = local. */
  localRoot: string;
  /** Directory for ZIP backups. */
  backupRoot: string;
  signedUrlTtlSeconds: number;
}

function env(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

export function getStorageConfig(): StorageConfig {
  const provider = env(
    "STORAGE_PROVIDER",
    "supabase"
  ) as StorageProviderKind;

  return {
    provider,
    defaultBucket: env("STORAGE_BUCKET", "dak-attachments"),
    localRoot: env("STORAGE_LOCAL_ROOT", "D:\\DakServer\\Storage"),
    backupRoot: env("BACKUP_ROOT", "D:\\DakServer\\Backups"),
    signedUrlTtlSeconds: Number(env("STORAGE_SIGNED_URL_TTL", "3600")) || 3600,
  };
}

export const APP_VERSION = process.env.npm_package_version ?? "0.1.0";
