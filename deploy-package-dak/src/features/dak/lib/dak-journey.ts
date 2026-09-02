import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import type {
  DakAtrRecord,
  DakRemarkRecord,
} from "@/features/remarks/services/get-remarks";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";

export type JourneyFilter =
  | "all"
  | "assignments"
  | "notes"
  | "atr"
  | "compliance"
  | "attachments"
  | "rework"
  | "closure";

export type JourneyEventKind =
  | "assignment"
  | "note"
  | "atr"
  | "compliance"
  | "attachment"
  | "rework"
  | "closure"
  | "received"
  | "forwarded"
  | "other";

export interface JourneyEvent {
  id: string;
  kind: JourneyEventKind;
  filterKeys: JourneyFilter[];
  createdAt: string;
  title: string;
  description: string | null;
  actorName: string | null;
  actorRole: string | null;
  departmentLabel: string | null;
  icon: string;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
}

function roleLabel(role: string | null | undefined): string | null {
  if (!role) return null;
  const map: Record<string, string> = {
    collector: "Collector",
    adm: "ADM",
    acp: "ACP",
    department_user: "Department Officer",
    section_user: "Section Officer",
    dak_operator: "DAK Operator",
  };
  return map[role] ?? role;
}

function classifyTimeline(event: DakTimelineEvent): {
  kind: JourneyEventKind;
  filterKeys: JourneyFilter[];
  icon: string;
  title: string;
} {
  const meta = event.metadata ?? {};
  const hay = `${event.actionType} ${event.actionTitle} ${event.description ?? ""}`.toLowerCase();

  if (meta.returned_for_rework === true || /rework|returned/.test(hay)) {
    return {
      kind: "rework",
      filterKeys: ["rework"],
      icon: "🔁",
      title: event.actionTitle || "Returned for Rework",
    };
  }
  if (
    event.actionType === "dak_assigned" ||
    event.actionType === "dak_reassigned" ||
    /assign/.test(hay)
  ) {
    return {
      kind: "assignment",
      filterKeys: ["assignments"],
      icon: "👤",
      title: event.actionTitle || "Assignment Changed",
    };
  }
  if (event.actionType === "closed" || /clos(ed|ure)|approved/.test(hay)) {
    return {
      kind: "closure",
      filterKeys: ["closure"],
      icon: "✔",
      title: event.actionTitle || "Closed DAK",
    };
  }
  if (event.actionType === "atr_submitted" || /\batr\b/.test(hay)) {
    return {
      kind: "atr",
      filterKeys: ["atr"],
      icon: "✅",
      title: event.actionTitle || "ATR Uploaded",
    };
  }
  if (/compliance/.test(hay)) {
    return {
      kind: "compliance",
      filterKeys: ["compliance"],
      icon: "📄",
      title: event.actionTitle || "Compliance Uploaded",
    };
  }
  if (event.actionType === "file_uploaded" || /attachment|upload|file/.test(hay)) {
    return {
      kind: "attachment",
      filterKeys: ["attachments"],
      icon: "📎",
      title: event.actionTitle || "Attachment Uploaded",
    };
  }
  if (event.actionType === "remark_added" || /remark|note/.test(hay)) {
    return {
      kind: "note",
      filterKeys: ["notes"],
      icon: "📝",
      title: event.actionTitle || "Added Note",
    };
  }
  if (event.actionType === "dak_created" || /receiv|regist/.test(hay)) {
    return {
      kind: "received",
      filterKeys: ["all"],
      icon: "📥",
      title: event.actionTitle || "DAK Received",
    };
  }
  if (/forward/.test(hay)) {
    return {
      kind: "forwarded",
      filterKeys: ["assignments"],
      icon: "📤",
      title: event.actionTitle || "Forwarded",
    };
  }

  return {
    kind: "other",
    filterKeys: ["all"],
    icon: "•",
    title: event.actionTitle || "Update",
  };
}

/** Merge timeline, remarks, and ATR into one chronological journey feed. */
export function buildDakJourneyEvents(params: {
  timeline: DakTimelineEvent[];
  remarks: DakRemarkRecord[];
  atrRecords: DakAtrRecord[];
}): JourneyEvent[] {
  const events: JourneyEvent[] = [];
  const seen = new Set<string>();

  for (const entry of params.timeline) {
    const classified = classifyTimeline(entry);
    const id = `timeline-${entry.id}`;
    seen.add(id);
    events.push({
      id,
      kind: classified.kind,
      filterKeys: classified.filterKeys,
      createdAt: entry.createdAt,
      title: classified.title,
      description: entry.description,
      actorName: entry.performerName,
      actorRole: roleLabel(entry.performerRole),
      departmentLabel: null,
      icon: classified.icon,
      attachmentName:
        typeof entry.metadata?.file_name === "string"
          ? entry.metadata.file_name
          : null,
      attachmentUrl:
        typeof entry.metadata?.download_url === "string"
          ? entry.metadata.download_url
          : null,
    });
  }

  for (const remark of params.remarks) {
    const id = `remark-${remark.id}`;
    // Skip if a near-duplicate timeline remark exists within 2s
    const duplicate = params.timeline.some(
      (t) =>
        t.actionType === "remark_added" &&
        Math.abs(
          new Date(t.createdAt).getTime() - new Date(remark.createdAt).getTime()
        ) < 2000
    );
    if (duplicate) continue;
    events.push({
      id,
      kind: "note",
      filterKeys: ["notes"],
      createdAt: remark.createdAt,
      title: "Added Note",
      description: remark.body,
      actorName: remark.authorName,
      actorRole: roleLabel(remark.authorRole),
      departmentLabel: null,
      icon: "📝",
    });
  }

  for (const atr of params.atrRecords) {
    const id = `atr-${atr.id}`;
    const duplicate = params.timeline.some(
      (t) =>
        t.actionType === "atr_submitted" &&
        Math.abs(
          new Date(t.createdAt).getTime() - new Date(atr.submittedAt).getTime()
        ) < 5000
    );
    if (duplicate) continue;
    events.push({
      id,
      kind: "atr",
      filterKeys: ["atr", "compliance"],
      createdAt: atr.submittedAt,
      title: "Uploaded ATR",
      description: atr.actionTaken,
      actorName: atr.submitterName,
      actorRole: roleLabel(atr.submitterRole),
      departmentLabel: null,
      icon: "✅",
      attachmentName: atr.attachmentFileName,
      attachmentUrl: atr.attachmentDownloadUrl,
    });
  }

  void seen;

  return events.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function matchesJourneyFilter(
  event: JourneyEvent,
  filter: JourneyFilter
): boolean {
  if (filter === "all") return true;
  return event.filterKeys.includes(filter) || event.kind === filter;
}

export type DocumentCategory =
  | "original"
  | "correspondence"
  | "atr"
  | "compliance"
  | "other";

export interface DocumentGroupItem {
  id: string;
  fileName: string;
  downloadUrl: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string | null;
  category: DocumentCategory;
}

export function groupDakDocuments(params: {
  attachments: DakAttachmentWithUrl[];
  atrRecords: DakAtrRecord[];
}): DocumentGroupItem[] {
  const items: DocumentGroupItem[] = [];

  for (const file of params.attachments) {
    const hay = `${file.file_path} ${file.file_name}`.toLowerCase();
    let category: DocumentCategory = "other";
    if (hay.includes("atr") || hay.includes("/tasks/")) category = "atr";
    else if (hay.includes("compliance")) category = "compliance";
    else if (hay.includes("correspondence") || hay.includes("remark")) {
      category = "correspondence";
    } else if (
      !hay.includes("/") ||
      hay.split("/").length <= 2 ||
      hay.includes("original")
    ) {
      category = "original";
    }

    items.push({
      id: file.id,
      fileName: file.file_name,
      downloadUrl: file.downloadUrl,
      fileSize: file.file_size,
      uploadedAt: file.created_at,
      uploadedBy: null,
      category,
    });
  }

  for (const atr of params.atrRecords) {
    if (!atr.attachmentFileName || !atr.attachmentDownloadUrl) continue;
    const already = items.some(
      (i) => i.fileName === atr.attachmentFileName
    );
    if (already) continue;
    items.push({
      id: `atr-file-${atr.id}`,
      fileName: atr.attachmentFileName,
      downloadUrl: atr.attachmentDownloadUrl,
      fileSize: 0,
      uploadedAt: atr.submittedAt,
      uploadedBy: atr.submitterName,
      category: "atr",
    });
  }

  return items.sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  original: "Original DAK",
  correspondence: "Correspondence",
  atr: "ATR",
  compliance: "Compliance",
  other: "Other Attachments",
};
