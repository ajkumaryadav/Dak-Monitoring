"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState, useTransition } from "react";
import {
  Archive,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveDakAction,
  cleanOrphansAction,
  createBackupAction,
  downloadBackupAction,
  getDakDeletionInventoryAction,
  permanentDeleteAction,
  previewOrphansAction,
  restoreArchivedAction,
  restoreBackupAction,
  restoreRecycleAction,
  runMaintenanceAction,
  verifyBackupAction,
} from "@/features/system-admin/actions/system-admin-actions";
import { formatBytes, formatDateTime } from "@/features/system-admin/lib/format";
import type { BackupRecord } from "@/features/system-admin/services/backup";
import type {
  DakDeletionInventory,
  LargestDakRow,
} from "@/features/system-admin/services/dak-inventory";
import type { RecycleBinEntry } from "@/features/system-admin/services/recycle-bin";
import type {
  DatabaseStats,
  StorageStats,
} from "@/features/system-admin/services/stats";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminTab =
  | "dashboard"
  | "backup"
  | "archive"
  | "recycle"
  | "storage"
  | "maintenance";

const TABS: Array<{ id: AdminTab; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "backup", label: "Backup & Restore" },
  { id: "archive", label: "Archive Manager" },
  { id: "recycle", label: "Recycle Bin" },
  { id: "storage", label: "Storage Explorer" },
  { id: "maintenance", label: "Database Maintenance" },
];

interface SystemAdminConsoleProps {
  database: DatabaseStats;
  storage: StorageStats;
  backups: BackupRecord[];
  recycleBin: RecycleBinEntry[];
  archived: Array<{
    id: string;
    dak_number: string;
    subject: string;
    archived_at: string | null;
    archive_period_years: number | null;
  }>;
  largestDaks: LargestDakRow[];
  canPermanentDelete: boolean;
  initialTab?: AdminTab;
}

function StatPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800"
      : tone === "warn"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-800"
        : tone === "danger"
          ? "border-destructive/25 bg-destructive/10 text-destructive"
          : "border-border/60 bg-background";

  return (
    <div className={cn("rounded-xl border px-3 py-2.5 shadow-sm", toneClass)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function formatDeletedDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function SystemAdminConsole({
  database,
  storage,
  backups,
  recycleBin,
  archived,
  largestDaks,
  canPermanentDelete,
  initialTab = "dashboard",
}: SystemAdminConsoleProps) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [pending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");
  const [selectedBackup, setSelectedBackup] = useState<string>("");
  const [archiveYears, setArchiveYears] = useState<1 | 2 | 3>(1);
  const [orphanPreview, setOrphanPreview] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inventories, setInventories] = useState<
    Record<string, DakDeletionInventory>
  >({});
  const [loadingInventory, setLoadingInventory] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    inventory: DakDeletionInventory;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  function refresh() {
    startTransition(() => router.refresh());
  }

  function switchTab(next: AdminTab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url.toString());
  }

  function run(
    action: () => Promise<{ success: boolean; message?: string }>,
    okMsg: string
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(okMsg);
        router.refresh();
      } else {
        toast.error(result.message ?? "Operation failed");
      }
    });
  }

  async function toggleDetails(dakId: string) {
    if (expandedId === dakId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(dakId);
    if (inventories[dakId]) return;

    setLoadingInventory(dakId);
    const result = await getDakDeletionInventoryAction(dakId);
    setLoadingInventory(null);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    setInventories((prev) => ({ ...prev, [dakId]: result.inventory }));
  }

  async function openPermanentDelete(dakId: string) {
    if (!canPermanentDelete) {
      toast.error("Only ACP can permanently delete a DAK.");
      return;
    }

    let inventory = inventories[dakId];
    if (!inventory) {
      setLoadingInventory(dakId);
      const result = await getDakDeletionInventoryAction(dakId);
      setLoadingInventory(null);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      inventory = result.inventory;
      setInventories((prev) => ({ ...prev, [dakId]: inventory! }));
    }

    setDeleteConfirm("");
    setDeleteTarget({ id: dakId, inventory });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Unified Database &amp; Storage Administration Console — Collector / ACP.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={refresh}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Refresh
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/30 p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => switchTab(item.id)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
              tab === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
            {item.id === "recycle" && recycleBin.length > 0 ? (
              <span className="ml-1.5 rounded-md bg-destructive/15 px-1.5 py-0.5 text-[10px] text-destructive">
                {recycleBin.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-4">
          <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-primary" />
              <h2 className="text-sm font-bold">Database Health</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <StatPill
                label="Database Size"
                value={formatBytes(database.databaseSizeBytes)}
              />
              <StatPill label="Used Space" value={formatBytes(database.usedSpaceBytes)} />
              <StatPill
                label="Free Space"
                value={
                  database.freeSpaceBytes == null
                    ? "Managed"
                    : formatBytes(database.freeSpaceBytes)
                }
              />
              <StatPill label="Total Tables" value={database.tableCount} />
              <StatPill label="Total Records" value={database.totalRecords} />
              <StatPill label="Active DAK" value={database.activeDak} tone="ok" />
              <StatPill label="Archived DAK" value={database.archivedDak} />
              <StatPill
                label="Recycle Bin"
                value={database.deletedDak}
                tone="warn"
              />
              <StatPill
                label="Health"
                value={database.health}
                tone={database.health === "healthy" ? "ok" : "warn"}
              />
              <StatPill label="Last Vacuum" value={formatDateTime(database.lastVacuum)} />
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <HardDrive className="size-4 text-primary" />
              <h2 className="text-sm font-bold">Storage Usage</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <StatPill label="Provider" value={storage.provider} />
              <StatPill label="Bucket" value={storage.bucket} />
              <StatPill label="Used Storage" value={formatBytes(storage.usedBytes)} />
              <StatPill label="Files" value={storage.fileCount} />
              <StatPill label="Attachments" value={storage.attachmentCount} />
              <StatPill label="ATR Files" value={storage.atrFiles} />
              <StatPill label="Compliance" value={storage.complianceFiles} />
              <StatPill
                label="Correspondence"
                value={storage.correspondenceFiles}
              />
            </div>
          </section>
        </div>
      )}

      {tab === "backup" && (
        <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-bold">Backup &amp; Restore</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              onClick={() =>
                run(async () => createBackupAction(), "Backup created and verified")
              }
            >
              Create Backup
            </button>
            <button
              type="button"
              disabled={pending || !selectedBackup}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              onClick={() =>
                run(async () => {
                  const result = await verifyBackupAction(selectedBackup);
                  if (!result.success) return result;
                  return {
                    success: true,
                    message: result.ok ? "passed" : "failed",
                  };
                }, "Backup verification complete")
              }
            >
              Verify Backup
            </button>
            <button
              type="button"
              disabled={pending || !selectedBackup}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              onClick={() =>
                startTransition(async () => {
                  const result = await downloadBackupAction(selectedBackup);
                  if (!result.success) {
                    toast.error(result.message);
                    return;
                  }
                  const binary = atob(result.base64);
                  const bytes = new Uint8Array(binary.length);
                  for (let i = 0; i < binary.length; i += 1) {
                    bytes[i] = binary.charCodeAt(i);
                  }
                  const blob = new Blob([bytes], { type: "application/zip" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = result.fileName;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Download started");
                })
              }
            >
              Download Backup
            </button>
            <button
              type="button"
              disabled={pending || !selectedBackup}
              className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
              onClick={() => {
                if (confirmText.trim().toUpperCase() !== "RESTORE") {
                  toast.error("Type RESTORE in the confirmation box first");
                  return;
                }
                run(
                  async () => restoreBackupAction(selectedBackup, confirmText),
                  "Restore completed"
                );
              }}
            >
              Restore Backup
            </button>
          </div>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type RESTORE to confirm restore"
            className="h-9 w-full max-w-md rounded-lg border px-3 text-sm"
          />
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Select</th>
                  <th className="px-3 py-2">Backup Name</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Created By</th>
                  <th className="px-3 py-2">Verification</th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      No backups yet. Create the first ZIP backup to begin.
                    </td>
                  </tr>
                ) : (
                  backups.map((backup) => (
                    <tr key={backup.id} className="border-t">
                      <td className="px-3 py-2">
                        <input
                          type="radio"
                          name="backup"
                          checked={selectedBackup === backup.id}
                          onChange={() => setSelectedBackup(backup.id)}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">{backup.backupName}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatBytes(backup.fileSize)}
                      </td>
                      <td className="px-3 py-2">
                        {formatDateTime(backup.createdAt)}
                      </td>
                      <td className="px-3 py-2">{backup.createdByName ?? "—"}</td>
                      <td className="px-3 py-2 capitalize">
                        {backup.verificationStatus}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "archive" && (
        <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-primary" />
            <h2 className="text-sm font-bold">Archive Manager</h2>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-xs">
              Archive closed DAK older than
              <select
                value={archiveYears}
                onChange={(e) =>
                  setArchiveYears(Number(e.target.value) as 1 | 2 | 3)
                }
                className="h-9 rounded-lg border px-2"
              >
                <option value={1}>1 Year</option>
                <option value={2}>2 Years</option>
                <option value={3}>3 Years</option>
              </select>
            </label>
            <button
              type="button"
              disabled={pending}
              className={cn(buttonVariants({ size: "sm" }))}
              onClick={() =>
                run(
                  async () => archiveDakAction(archiveYears),
                  "Archive completed"
                )
              }
            >
              Archive Now
            </button>
          </div>
          <ul className="space-y-2 text-xs">
            {archived.length === 0 ? (
              <li className="text-muted-foreground">No archived DAK.</li>
            ) : (
              archived.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <span>
                    <span className="font-semibold">{row.dak_number}</span> —{" "}
                    {row.subject}
                  </span>
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" })
                    )}
                    onClick={() =>
                      run(
                        async () => restoreArchivedAction([row.id]),
                        "Archived DAK restored"
                      )
                    }
                  >
                    Restore to Active
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      )}

      {tab === "recycle" && (
        <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <Trash2 className="size-4 text-destructive" />
            <h2 className="text-sm font-bold">Recycle Bin</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Soft-deleted DAKs from Details → Delete DAK. Restore returns them to
            active lists. Permanent Delete (ACP) cannot be undone.
          </p>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[880px] text-left text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">DAK No</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Deleted By</th>
                  <th className="px-3 py-2">Deleted Date</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recycleBin.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      Recycle Bin is empty. Use{" "}
                      <span className="font-medium text-foreground">Delete DAK</span>{" "}
                      on any DAK Details page (Collector / ACP) to move a file here.
                    </td>
                  </tr>
                ) : (
                  recycleBin.map((row) => {
                    const inventory = inventories[row.id];
                    const open = expandedId === row.id;
                    return (
                      <Fragment key={row.id}>
                        <tr className="border-t align-top">
                          <td className="px-3 py-2.5 font-semibold">
                            {row.dakNumber}
                          </td>
                          <td className="px-3 py-2.5 max-w-[220px]">
                            <span className="line-clamp-2">{row.subject}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            {row.deletedByName ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums">
                            {formatDeletedDate(row.deletedAt)}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums">
                            {formatBytes(row.sizeBytes)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                className={cn(
                                  buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                  }),
                                  "gap-1"
                                )}
                                onClick={() => toggleDetails(row.id)}
                              >
                                {open ? (
                                  <ChevronDown className="size-3" />
                                ) : (
                                  <ChevronRight className="size-3" />
                                )}
                                DAK Details
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                  })
                                )}
                                onClick={() =>
                                  run(
                                    async () => restoreRecycleAction(row.id),
                                    "Restored from Recycle Bin"
                                  )
                                }
                              >
                                Restore
                              </button>
                              {canPermanentDelete ? (
                                <button
                                  type="button"
                                  disabled={loadingInventory === row.id}
                                  className={cn(
                                    buttonVariants({
                                      variant: "destructive",
                                      size: "sm",
                                    })
                                  )}
                                  onClick={() => openPermanentDelete(row.id)}
                                >
                                  Permanent Delete
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                        {open ? (
                          <tr className="border-t bg-muted/20">
                            <td colSpan={6} className="px-4 py-3">
                              {loadingInventory === row.id && !inventory ? (
                                <p className="flex items-center gap-2 text-muted-foreground">
                                  <Loader2 className="size-3.5 animate-spin" />
                                  Loading contents…
                                </p>
                              ) : inventory ? (
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold">
                                    {inventory.dakNumber}
                                  </p>
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Contains
                                  </p>
                                  <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                                    <li>Original DAK PDF — {inventory.originalPdfs}</li>
                                    <li>
                                      Correspondence — {inventory.correspondence}
                                    </li>
                                    <li>ATR Uploads — {inventory.atrUploads}</li>
                                    <li>
                                      Compliance Reports —{" "}
                                      {inventory.complianceReports}
                                    </li>
                                    <li>Notes — {inventory.notesRemarks}</li>
                                    <li>
                                      Notifications — {inventory.notifications}
                                    </li>
                                    <li>Tasks — {inventory.tasks}</li>
                                    <li>
                                      Database Records —{" "}
                                      {inventory.databaseRecords}
                                    </li>
                                    <li>
                                      Storage —{" "}
                                      {formatBytes(inventory.storageBytes)}
                                    </li>
                                  </ul>
                                </div>
                              ) : (
                                <p className="text-muted-foreground">
                                  Could not load inventory.
                                </p>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "storage" && (
        <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-primary" />
            <h2 className="text-sm font-bold">Storage Explorer</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Top 20 largest DAKs by attachment storage — identify space consumers
            before archive or delete.
          </p>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">DAK No</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Files</th>
                  <th className="px-3 py-2">Total Size</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {largestDaks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      No attachment storage recorded yet.
                    </td>
                  </tr>
                ) : (
                  largestDaks.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-2 font-semibold">{row.dakNumber}</td>
                      <td className="px-3 py-2 max-w-[240px]">
                        <span className="line-clamp-2">{row.subject}</span>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{row.fileCount}</td>
                      <td className="px-3 py-2 font-medium tabular-nums">
                        {formatBytes(row.totalSize)}
                      </td>
                      <td className="px-3 py-2 capitalize">
                        {row.deleted
                          ? "Recycle Bin"
                          : row.archived
                            ? "Archived"
                            : row.status}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1.5">
                          {!row.deleted ? (
                            <Link
                              href={`/dashboard/dak/${row.id}`}
                              className={cn(
                                buttonVariants({
                                  variant: "outline",
                                  size: "sm",
                                })
                              )}
                            >
                              Open
                            </Link>
                          ) : null}
                          {!row.deleted && !row.archived ? (
                            <>
                              <button
                                type="button"
                                className={cn(
                                  buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                  })
                                )}
                                onClick={() => switchTab("archive")}
                              >
                                Archive
                              </button>
                              <Link
                                href={`/dashboard/dak/${row.id}`}
                                className={cn(
                                  buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                  }),
                                  "text-destructive"
                                )}
                              >
                                Delete
                              </Link>
                            </>
                          ) : null}
                          {row.deleted ? (
                            <button
                              type="button"
                              className={cn(
                                buttonVariants({
                                  variant: "outline",
                                  size: "sm",
                                })
                              )}
                              onClick={() => switchTab("recycle")}
                            >
                              Open in Recycle Bin
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "maintenance" && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-600" />
              <h2 className="text-sm font-bold">Orphan Cleaner</h2>
            </div>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to clean orphans"
              className="h-9 w-full rounded-lg border px-3 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                onClick={() =>
                  startTransition(async () => {
                    const result = await previewOrphansAction();
                    if (!result.success) {
                      toast.error(result.message);
                      return;
                    }
                    setOrphanPreview(
                      `DB orphans: ${result.report.orphanDbRecords.length} · File orphans: ${result.report.orphanFiles.length} · Recoverable: ${formatBytes(result.report.recoverableBytes)}`
                    );
                    toast.message("Orphan preview ready");
                  })
                }
              >
                Preview
              </button>
              <button
                type="button"
                disabled={pending}
                className={cn(
                  buttonVariants({ variant: "destructive", size: "sm" })
                )}
                onClick={() => {
                  if (confirmText.trim().toUpperCase() !== "DELETE") {
                    toast.error("Type DELETE to clean orphans");
                    return;
                  }
                  run(
                    async () => cleanOrphansAction(confirmText),
                    "Orphan cleanup complete"
                  );
                }}
              >
                Clean
              </button>
            </div>
            {orphanPreview ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
                {orphanPreview}
              </p>
            ) : null}
          </div>

          <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-bold">Database Optimization</h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["vacuum", "Vacuum"],
                  ["analyze", "Analyze"],
                  ["reindex", "Reindex / Refresh"],
                  ["cleanup_logs", "Cleanup Logs"],
                  ["cleanup_temp", "Cleanup Temp"],
                  ["refresh_stats", "Refresh Statistics"],
                ] as const
              ).map(([op, label]) => (
                <button
                  key={op}
                  type="button"
                  disabled={pending}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" })
                  )}
                  onClick={() =>
                    run(async () => runMaintenanceAction(op), `${label} done`)
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Vacuum / Analyze require migration RPC. Operations are audited.
            </p>
          </div>
        </section>
      )}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40"
            onClick={() => !pending && setDeleteTarget(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-5 shadow-xl"
          >
            <h2 className="text-base font-semibold text-destructive">
              This operation cannot be undone.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The following will be permanently removed for{" "}
              <span className="font-medium text-foreground">
                {deleteTarget.inventory.dakNumber}
              </span>
              :
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {[
                "DAK Record",
                "Department Assignment",
                "Internal Section Assignment",
                "Correspondence",
                "Notes",
                "Remarks",
                "Notifications",
                "Tasks",
                "ATR Uploads",
                "Compliance Uploads",
                "All Attachments",
                "Bucket Files",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border bg-muted/30 p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Estimated Space Recovery
              </p>
              <dl className="mt-2 grid gap-1 tabular-nums">
                <div className="flex justify-between gap-4">
                  <dt>Database</dt>
                  <dd>{formatBytes(deleteTarget.inventory.estimatedDbBytes)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Storage</dt>
                  <dd>{formatBytes(deleteTarget.inventory.storageBytes)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t pt-1 font-semibold">
                  <dt>Total</dt>
                  <dd>
                    {formatBytes(
                      deleteTarget.inventory.estimatedDbBytes +
                        deleteTarget.inventory.storageBytes
                    )}
                  </dd>
                </div>
              </dl>
            </div>
            <label className="mt-4 grid gap-1.5 text-sm">
              <span className="font-medium">Type DELETE to continue</span>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="h-9 rounded-lg border px-3"
                placeholder="DELETE"
                autoComplete="off"
              />
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || deleteConfirm.trim().toUpperCase() !== "DELETE"}
                className={cn(
                  buttonVariants({ variant: "destructive", size: "sm" }),
                  "gap-1.5"
                )}
                onClick={() => {
                  const id = deleteTarget.id;
                  run(async () => {
                    const result = await permanentDeleteAction(id, deleteConfirm);
                    if (result.success) setDeleteTarget(null);
                    return result;
                  }, "Permanently deleted");
                }}
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
