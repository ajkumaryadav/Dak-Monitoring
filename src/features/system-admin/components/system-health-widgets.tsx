import Link from "next/link";
import {
  Archive,
  Database,
  HardDrive,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { formatBytes, formatDateTime } from "@/features/system-admin/lib/format";
import type { DatabaseStats, StorageStats } from "@/features/system-admin/services/stats";
import type { BackupRecord } from "@/features/system-admin/services/backup";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { cn } from "@/lib/utils";

interface SystemHealthWidgetsProps {
  database: DatabaseStats;
  storage: StorageStats;
  lastBackup: BackupRecord | null;
  orphanFileCount?: number;
  orphanRecordCount?: number;
  showExtended?: boolean;
}

/** Collector/ACP dashboard widgets for DB & storage health. */
export function SystemHealthWidgets({
  database,
  storage,
  lastBackup,
  orphanFileCount = 0,
  orphanRecordCount = 0,
  showExtended = false,
}: SystemHealthWidgetsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          Database &amp; Storage Health
        </p>
        <Link
          href="/dashboard/admin/database-storage"
          className="text-xs font-medium text-primary hover:underline"
        >
          Open module →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Database Size"
          value={formatBytes(database.databaseSizeBytes)}
          icon={Database}
          variant="primary"
          description={`Health: ${database.health}`}
        />
        <StatCard
          title="Storage Used"
          value={formatBytes(storage.usedBytes)}
          icon={HardDrive}
          variant="info"
          description={`${storage.fileCount} files · ${storage.provider}`}
        />
        <StatCard
          title="Storage Remaining"
          value={
            storage.remainingBytes == null
              ? "Managed"
              : formatBytes(storage.remainingBytes)
          }
          icon={HardDrive}
          variant="success"
          description={storage.bucket}
        />
        <StatCard
          title="Active / Archived / Deleted"
          value={`${database.activeDak} / ${database.archivedDak} / ${database.deletedDak}`}
          icon={Archive}
          variant="warning"
          description="DAK lifecycle counts"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border bg-background/80 px-4 py-3 text-sm shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Last Backup
          </p>
          <p className="mt-1 font-semibold">
            {lastBackup?.backupName ?? "No backup yet"}
          </p>
          <p className="text-xs text-muted-foreground">
            {lastBackup
              ? `${formatDateTime(lastBackup.createdAt)} · ${formatBytes(lastBackup.fileSize)}`
              : "Create a ZIP backup from Database & Storage"}
          </p>
        </div>
        <div className="rounded-xl border bg-background/80 px-4 py-3 text-sm shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Backup Health
          </p>
          <p
            className={cn(
              "mt-1 font-semibold capitalize",
              lastBackup?.verificationStatus === "passed"
                ? "text-emerald-700"
                : "text-amber-700"
            )}
          >
            {lastBackup?.verificationStatus ?? "unknown"}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Verification status of latest backup
          </p>
        </div>
        {showExtended ? (
          <div className="rounded-xl border bg-background/80 px-4 py-3 text-sm shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Orphans
            </p>
            <p className="mt-1 font-semibold tabular-nums">
              {orphanRecordCount} records · {orphanFileCount} files
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Trash2 className="size-3.5" />
              ACP extended storage hygiene view
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
