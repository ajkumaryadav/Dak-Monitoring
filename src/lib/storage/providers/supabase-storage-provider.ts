import { createAdminClient } from "@/lib/supabase/admin";
import type {
  StorageDownloadResult,
  StorageListOptions,
  StorageObjectMeta,
  StorageProvider,
  StorageUploadInput,
} from "@/lib/storage/types";

/** Supabase Storage adapter — only this module talks to supabase.storage. */
export class SupabaseStorageProvider implements StorageProvider {
  readonly kind = "supabase";

  async upload(input: StorageUploadInput): Promise<{ path: string }> {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(input.bucket)
      .upload(input.path, input.data, {
        contentType: input.contentType ?? "application/octet-stream",
        upsert: input.upsert ?? false,
      });

    if (error) {
      throw new Error(`[SupabaseStorage] upload failed: ${error.message}`);
    }

    return { path: input.path };
  }

  async download(bucket: string, path: string): Promise<StorageDownloadResult> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error || !data) {
      throw new Error(
        `[SupabaseStorage] download failed: ${error?.message ?? "missing object"}`
      );
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return { data: buffer, contentType: data.type || null };
  }

  async remove(bucket: string, paths: string[]): Promise<void> {
    if (!paths.length) return;
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      throw new Error(`[SupabaseStorage] remove failed: ${error.message}`);
    }
  }

  async list(
    bucket: string,
    options: StorageListOptions = {}
  ): Promise<StorageObjectMeta[]> {
    const supabase = createAdminClient();
    const prefix = options.prefix ?? "";
    const limit = options.limit ?? 1000;
    const results: StorageObjectMeta[] = [];

    async function walk(folder: string) {
      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        limit,
        sortBy: { column: "name", order: "asc" },
      });

      if (error) {
        throw new Error(`[SupabaseStorage] list failed: ${error.message}`);
      }

      for (const item of data ?? []) {
        const fullPath = folder ? `${folder}/${item.name}` : item.name;
        const isFolder = !item.id;

        if (isFolder) {
          await walk(fullPath);
          continue;
        }

        results.push({
          path: fullPath,
          size: Number(item.metadata?.size ?? 0),
          contentType: (item.metadata?.mimetype as string | undefined) ?? null,
          updatedAt: item.updated_at ?? item.created_at ?? null,
        });
      }
    }

    await walk(prefix.replace(/\/$/, ""));
    return results;
  }

  async exists(bucket: string, path: string): Promise<boolean> {
    try {
      await this.download(bucket, path);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number
  ): Promise<string | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      console.error("[SupabaseStorage] signedUrl", error.message);
      return null;
    }

    return data.signedUrl;
  }

  async getUsage(
    bucket: string
  ): Promise<{ fileCount: number; totalBytes: number }> {
    const objects = await this.list(bucket);
    return {
      fileCount: objects.length,
      totalBytes: objects.reduce((sum, o) => sum + (o.size || 0), 0),
    };
  }
}
