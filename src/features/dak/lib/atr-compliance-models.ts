import { getDepartmentName, getSourceName } from "@/features/dak/lib/dak-display";
import type { DakListEntry } from "@/features/dak/services/get-dak-stats";
import type { DakStatus } from "@/types";

export const ATR_COMPLIANCE_STATUSES: DakStatus[] = [
  "atr_submitted",
  "pending_approval",
];

export interface AtrComplianceEntry extends DakListEntry {
  submittedBy: string | null;
  submittedAt: string | null;
  statusLabel: string;
}

export function enrichAtrComplianceDisplay(entry: AtrComplianceEntry) {
  return {
    origin: getSourceName(entry.dak_sources),
    department: getDepartmentName(entry.departments),
    statusLabel: entry.statusLabel,
  };
}
