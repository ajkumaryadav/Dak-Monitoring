import { createAdminClient } from "@/lib/supabase/admin";
import { createStorageService } from "@/lib/storage/storage-service";
import { getStorageConfig } from "@/lib/storage/config";

export interface DatabaseStats {
  databaseName: string;
  databaseSizeBytes: number;
  usedSpaceBytes: number;
  freeSpaceBytes: number | null;
  tableCount: number;
  totalRecords: number;
  activeDak: number;
  archivedDak: number;
  deletedDak: number;
  health: "healthy" | "warning" | "critical" | "unknown";
  lastVacuum: string | null;
  lastAnalyze: string | null;
  collectedAt: string;
}

export interface StorageStats {
  provider: string;
  bucket: string;
  totalBucketBytes: number | null;
  usedBytes: number;
  remainingBytes: number | null;
  fileCount: number;
  largestFiles: Array<{ path: string; size: number }>;
  averageFileSize: number;
  attachmentCount: number;
  atrFiles: number;
  complianceFiles: number;
  correspondenceFiles: number;
}

function classifyFile(path: string): "atr" | "compliance" | "correspondence" | "other" {
  const lower = path.toLowerCase();
  if (lower.includes("atr") || lower.includes("/tasks/")) return "atr";
  if (lower.includes("compliance")) return "compliance";
  if (lower.includes("correspondence") || lower.includes("remark")) {
    return "correspondence";
  }
  return "other";
}

function healthFromStats(stats: {
  deletedDak: number;
  activeDak: number;
}): DatabaseStats["health"] {
  if (stats.deletedDak > Math.max(100, stats.activeDak)) return "warning";
  return "healthy";
}

/** Live PostgreSQL + DAK lifecycle stats for the admin module. */
export async function fetchDatabaseStats(): Promise<DatabaseStats> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_database_storage_stats");

  if (error || !data) {
    console.error("[fetchDatabaseStats]", error?.message);
    // Fallback — count from tables when RPC is not yet applied
    const [active, archived, deleted, tables] = await Promise.all([
      supabase
        .from("dak_entries")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .is("archived_at", null),
      supabase
        .from("dak_entries")
        .select("id", { count: "exact", head: true })
        .not("archived_at", "is", null)
        .is("deleted_at", null),
      supabase
        .from("dak_entries")
        .select("id", { count: "exact", head: true })
        .not("deleted_at", "is", null),
      supabase.from("attachments").select("id", { count: "exact", head: true }),
    ]);

    const activeDak = active.count ?? 0;
    const archivedDak = archived.count ?? 0;
    const deletedDak = deleted.count ?? 0;

    return {
      databaseName: "dak-monitoring",
      databaseSizeBytes: 0,
      usedSpaceBytes: 0,
      freeSpaceBytes: null,
      tableCount: 0,
      totalRecords: activeDak + archivedDak + deletedDak + (tables.count ?? 0),
      activeDak,
      archivedDak,
      deletedDak,
      health: "unknown",
      lastVacuum: null,
      lastAnalyze: null,
      collectedAt: new Date().toISOString(),
    };
  }

  const row = data as Record<string, unknown>;
  const size = Number(row.database_size_bytes ?? 0);
  const activeDak = Number(row.active_dak ?? 0);
  const archivedDak = Number(row.archived_dak ?? 0);
  const deletedDak = Number(row.deleted_dak ?? 0);

  return {
    databaseName: String(row.database_name ?? "postgres"),
    databaseSizeBytes: size,
    usedSpaceBytes: size,
    freeSpaceBytes: null,
    tableCount: Number(row.table_count ?? 0),
    totalRecords: Number(row.total_records ?? 0),
    activeDak,
    archivedDak,
    deletedDak,
    health: healthFromStats({ deletedDak, activeDak }),
    lastVacuum: (row.last_vacuum as string | null) ?? null,
    lastAnalyze:
      (row.last_analyze as string | null) ??
      (row.last_autoanalyze as string | null) ??
      null,
    collectedAt: String(row.collected_at ?? new Date().toISOString()),
  };
}

/** Storage usage via Storage Service Layer + attachment metadata. */
export async function fetchStorageStats(): Promise<StorageStats> {
  const config = getStorageConfig();
  const storage = createStorageService();
  const supabase = createAdminClient();

  let usage = { fileCount: 0, totalBytes: 0 };
  let objects: Array<{ path: string; size: number }> = [];

  try {
    usage = await storage.getUsage();
    objects = (await storage.list({ limit: 5000 }))
      .map((o) => ({ path: o.path, size: o.size }))
      .sort((a, b) => b.size - a.size);
  } catch (error) {
    console.error("[fetchStorageStats] provider", error);
  }

  const { data: attachments } = await supabase
    .from("attachments")
    .select("file_path, file_size");

  const rows = attachments ?? [];
  let atrFiles = 0;
  let complianceFiles = 0;
  let correspondenceFiles = 0;

  for (const row of rows) {
    const kind = classifyFile(String(row.file_path ?? ""));
    if (kind === "atr") atrFiles += 1;
    else if (kind === "compliance") complianceFiles += 1;
    else if (kind === "correspondence") correspondenceFiles += 1;
  }

  const usedBytes =
    usage.totalBytes ||
    rows.reduce((sum, r) => sum + Number(r.file_size ?? 0), 0);
  const fileCount = usage.fileCount || rows.length;
  const averageFileSize = fileCount > 0 ? Math.round(usedBytes / fileCount) : 0;

  return {
    provider: storage.providerKind,
    bucket: config.defaultBucket,
    totalBucketBytes: null,
    usedBytes,
    remainingBytes: null,
    fileCount,
    largestFiles: objects.slice(0, 8),
    averageFileSize,
    attachmentCount: rows.length,
    atrFiles,
    complianceFiles,
    correspondenceFiles,
  };
}
