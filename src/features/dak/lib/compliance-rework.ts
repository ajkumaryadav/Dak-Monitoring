import type { DakAtrRecord } from "@/features/remarks/services/get-remarks";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";

export interface CollectorReturnNotice {
  title: string;
  body: string;
  createdAt: string;
  statusLabel: string;
}

export type ComplianceVersionStatus =
  | "submitted"
  | "returned"
  | "awaiting_review"
  | "approved";

export interface ComplianceVersion {
  version: number;
  submission: DakAtrRecord;
  status: ComplianceVersionStatus;
  returnedAt?: string;
  returnReason?: string;
}

function getReturnEvents(events: DakTimelineEvent[]): DakTimelineEvent[] {
  return events
    .filter((entry) => entry.metadata?.returned_for_rework === true)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/** Latest collector return event (newest first in timeline feed). */
export function extractCollectorReturnNotice(
  events: DakTimelineEvent[]
): CollectorReturnNotice | null {
  const event = getReturnEvents(events)[0];
  if (!event) return null;

  return {
    title: "Returned by Collector",
    body:
      event.description?.trim() ||
      "Please revise your compliance submission and resubmit.",
    createdAt: event.createdAt,
    statusLabel: "Returned for Rework",
  };
}

/** Show rework banner until department resubmits compliance after the latest return. */
export function shouldShowReworkBanner(
  events: DakTimelineEvent[],
  atrRecords: DakAtrRecord[],
  dakStatus: string
): boolean {
  const latestReturn = getReturnEvents(events)[0];
  if (!latestReturn) return false;

  if (dakStatus === "pending_approval" || dakStatus === "atr_submitted") {
    return false;
  }

  const latestSubmission = atrRecords[0];
  if (!latestSubmission) {
    return dakStatus === "in_progress" || dakStatus === "pending";
  }

  return (
    new Date(latestReturn.createdAt).getTime() >
    new Date(latestSubmission.submittedAt).getTime()
  );
}

export function isAwaitingReworkResubmission(
  events: DakTimelineEvent[],
  dakStatus: string
): boolean {
  if (dakStatus !== "in_progress" && dakStatus !== "pending") {
    return false;
  }
  return getReturnEvents(events).length > 0 && shouldShowReworkBanner(events, [], dakStatus);
}

/** Build version history from ATR submissions and collector return events. */
export function buildComplianceVersionHistory(
  atrRecords: DakAtrRecord[],
  events: DakTimelineEvent[],
  dakStatus: string
): ComplianceVersion[] {
  if (!atrRecords.length) return [];

  const submissions = [...atrRecords].sort(
    (a, b) =>
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  const returnEvents = [...getReturnEvents(events)].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return submissions.map((submission, index) => {
    const version = index + 1;
    const submittedAt = new Date(submission.submittedAt).getTime();
    const nextSubmittedAt =
      index < submissions.length - 1
        ? new Date(submissions[index + 1].submittedAt).getTime()
        : Number.POSITIVE_INFINITY;

    const matchingReturn = returnEvents.find((entry) => {
      const returnAt = new Date(entry.createdAt).getTime();
      return returnAt >= submittedAt && returnAt < nextSubmittedAt;
    });

    let status: ComplianceVersionStatus = "submitted";

    if (matchingReturn) {
      status = "returned";
    } else if (
      version === submissions.length &&
      (dakStatus === "pending_approval" || dakStatus === "atr_submitted")
    ) {
      status = "awaiting_review";
    } else if (
      version === submissions.length &&
      (dakStatus === "closed" || dakStatus === "completed")
    ) {
      status = "approved";
    }

    return {
      version,
      submission,
      status,
      returnedAt: matchingReturn?.createdAt,
      returnReason: matchingReturn?.description ?? undefined,
    };
  });
}
