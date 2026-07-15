import { createHash } from "crypto";
import {
  access,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "fs/promises";
import path from "path";

import type {
  StorageDownloadResult,
  StorageListOptions,
  StorageObjectMeta,
  StorageProvider,
  StorageUploadInput,
} from "@/lib/storage/types";

/** Local filesystem provider for self-hosted DakServer deployments. */
export class LocalStorageProvider implements StorageProvider {
  readonly kind = "local";

  constructor(private readonly root: string) {}

  private resolve(bucket: string, objectPath: string): string {
    const safe = objectPath.replace(/^[/\\]+/, "").replace(/\.\./g, "");
    return path.join(this.root, bucket, safe);
  }

  private async ensureParent(filePath: string) {
    await mkdir(path.dirname(filePath), { recursive: true });
  }

  async upload(input: StorageUploadInput): Promise<{ path: string }> {
    const target = this.resolve(input.bucket, input.path);
    await this.ensureParent(target);

    if (!input.upsert) {
      try {
        await access(target);
        throw new Error(`[LocalStorage] object already exists: ${input.path}`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          if (error instanceof Error && error.message.includes("already exists")) {
            throw error;
          }
        }
      }
    }

    await writeFile(target, Buffer.from(input.data));
    return { path: input.path };
  }

  async download(bucket: string, objectPath: string): Promise<StorageDownloadResult> {
    const target = this.resolve(bucket, objectPath);
    const data = await readFile(target);
    return { data, contentType: null };
  }

  async remove(bucket: string, paths: string[]): Promise<void> {
    for (const objectPath of paths) {
      const target = this.resolve(bucket, objectPath);
      await rm(target, { force: true });
    }
  }

  async list(
    bucket: string,
    options: StorageListOptions = {}
  ): Promise<StorageObjectMeta[]> {
    const base = this.resolve(bucket, options.prefix ?? "");
    const results: StorageObjectMeta[] = [];

    async function walk(dir: string, relative: string) {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const rel = relative ? `${relative}/${entry.name}` : entry.name;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full, rel);
        } else {
          const info = await stat(full);
          results.push({
            path: rel.replace(/\\/g, "/"),
            size: info.size,
            updatedAt: info.mtime.toISOString(),
          });
        }
      }
    }

    try {
      const info = await stat(base);
      if (info.isFile()) {
        results.push({
          path: (options.prefix ?? "").replace(/\\/g, "/"),
          size: info.size,
          updatedAt: info.mtime.toISOString(),
        });
        return results;
      }
    } catch {
      return [];
    }

    await walk(base, options.prefix ?? "");
    return results.slice(0, options.limit ?? results.length);
  }

  async exists(bucket: string, objectPath: string): Promise<boolean> {
    try {
      await access(this.resolve(bucket, objectPath));
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(
    _bucket: string,
    pathValue: string,
    _expiresInSeconds: number
  ): Promise<string | null> {
    // Local provider — signed URLs are served via authenticated API routes later.
    const token = createHash("sha256").update(pathValue).digest("hex").slice(0, 16);
    return `/api/storage/local?path=${encodeURIComponent(pathValue)}&t=${token}`;
  }

  async getUsage(
    bucket: string
  ): Promise<{ fileCount: number; totalBytes: number }> {
    const objects = await this.list(bucket);
    return {
      fileCount: objects.length,
      totalBytes: objects.reduce((sum, o) => sum + o.size, 0),
    };
  }
}
