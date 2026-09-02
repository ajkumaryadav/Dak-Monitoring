import { createAdminClient } from "@/lib/supabase/admin";
import { getDepartmentName, getSourceName } from "@/features/dak/lib/dak-display";
import { formatProcessStatusLabel } from "@/features/dak/lib/compliance-workflow";
import { normalizeDakStatus } from "@/features/dak/lib/workflow";
import type { DakListEntry } from "@/features/dak/services/get-dak-stats";
import { getFilteredDakList } from "@/features/dak/services/get-dak-stats";
import type { DakStatus } from "@/types";

const ATR_COMPLIANCE_STATUSES: DakStatus[] = ["atr_submitted", "pending_approval"];

export interface AtrComplianceEntry extends DakListEntry {
  submittedBy: string | null;
  submittedAt: string | null;
  statusLabel: string;
}

interface LatestSubmissionRow {
  dak_id: string;
  submitted_at: string;
  submitter: { name?: string } | { name?: string }[] | null;
}

/** DAKs returned to Collector with ATR or compliance awaiting review. */
export async function getAtrComplianceReceivedEntries(): Promise<
  AtrComplianceEntry[]
> {
  const entries = await getFilteredDakList("atr_compliance");
  if (!entries.length) {
    return [];
  }

  const dakIds = entries.map((entry) => entry.id);
  const supabase = createAdminClient();

  const { data: atrRows, error } = await supabase
    .from("dak_atr")
    .select(
      "dak_id, submitted_at, submitter:users!dak_atr_submitted_by_fkey(name)"
    )
    .in("dak_id", dakIds)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("[getAtrComplianceReceivedEntries]", error.message);
  }

  const latestByDak = new Map<string, LatestSubmissionRow>();

  for (const row of atrRows ?? []) {
    const dakId = row.dak_id as string;
    if (!latestByDak.has(dakId)) {
      latestByDak.set(dakId, row as LatestSubmissionRow);
    }
  }

  return entries.map((entry) => {
    const submission = latestByDak.get(entry.id);
    const submitter = submission?.submitter;
    const submitterData = Array.isArray(submitter) ? submitter[0] : submitter;
    const normalized = normalizeDakStatus(entry.status);

    return {
      ...entry,
      submittedBy: submitterData?.name ?? null,
      submittedAt: submission?.submitted_at ?? entry.created_at,
      statusLabel: formatProcessStatusLabel(normalized),
    };
  });
}

export async function getAtrCompliancePendingDakIds(): Promise<string[]> {
  const entries = await getAtrComplianceReceivedEntries();
  return entries.map((entry) => entry.id);
}

export function enrichAtrComplianceDisplay(entry: AtrComplianceEntry) {
  return {
    origin: getSourceName(entry.dak_sources),
    department: getDepartmentName(entry.departments),
    statusLabel: entry.statusLabel,
  };
}

export { ATR_COMPLIANCE_STATUSES };
