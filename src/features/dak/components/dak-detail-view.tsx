import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DakDetailTabs } from "@/features/remarks/components/dak-detail-tabs";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import type {
  DakAtrRecord,
  DakRemarkRecord,
} from "@/features/remarks/services/get-remarks";
import {
  calculatePendingDays,
  formatPendingDays,
} from "@/features/audit/lib/pending-days";
import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import { AssignDakForm } from "@/features/dak/components/assign-dak-form";
import { AttachmentCard } from "@/features/dak/components/attachment-card";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { DakStatusForm } from "@/features/dak/components/dak-status-form";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import { getAllowedTransitions } from "@/features/dak/lib/workflow";
import {
  formatAssignmentLabel,
  formatDakDate,
  formatDakStatus,
  formatAssignmentType,
  getDepartmentName,
  getOfficerName,
  getSourceName,
  getUnitName,
  getStatusStyle,
  priorityStyles,
  getBadgeClassName,
} from "@/features/dak/lib/dak-display";
import type { AssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import type { DakDetail } from "@/features/dak/services/get-dak-by-id";
import { cn } from "@/lib/utils";

interface DakDetailViewProps {
  dak: DakDetail;
  timeline: DakHistoryEntry[];
  attachments: DakAttachmentWithUrl[];
  assignOptions: AssignFormOptions;
  showAssignForm: boolean;
  isReassign?: boolean;
  canUpdateStatus: boolean;
  remarks: DakRemarkRecord[];
  atrRecords: DakAtrRecord[];
  remarkPermissions: RemarkPermissions;
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-3 last:border-0 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

function buildTimelineEntries(
  dak: DakDetail,
  logs: DakHistoryEntry[]
): DakHistoryEntry[] {
  if (logs.length > 0) {
    return logs;
  }

  return [
    {
      id: "registered-fallback",
      dakId: dak.id,
      eventType: "dak_registered",
      actionLabel: "DAK Registered",
      remarks: dak.description,
      fromStatus: null,
      toStatus: null,
      metadata: {},
      createdAt: dak.created_at,
      performerName: null,
      performerRole: null,
    },
  ];
}

export function DakDetailView({
  dak,
  timeline,
  attachments,
  assignOptions,
  showAssignForm,
  isReassign = false,
  canUpdateStatus,
  remarks,
  atrRecords,
  remarkPermissions,
}: DakDetailViewProps) {
  const entries = buildTimelineEntries(dak, timeline);
  const allowedTransitions = getAllowedTransitions(dak.status);
  const pendingDays = calculatePendingDays({
    receivedDate: dak.received_date,
    createdAt: dak.created_at,
    status: dak.status,
    disposedDate: dak.disposed_date,
    closedDate: dak.closed_date,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/dak"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-9 w-fit gap-1.5 px-4"
          )}
        >
          <ArrowLeft className="size-4" />
          Back to All DAK
        </Link>
        <Badge variant="secondary" className="w-fit capitalize">
          {formatPendingDays(pendingDays)}
        </Badge>
      </div>

      <DakPageHeader
        title={dak.dak_number}
        description={dak.subject}
        icon={FileText}
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background lg:col-span-3">
          <CardHeader className="border-b border-border/60">
            <CardTitle>DAK Details</CardTitle>
            <CardDescription>
              Source, assignment, priority, status, and correspondence information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="DAK Number">
                <span className="font-semibold text-primary">
                  {dak.dak_number}
                </span>
              </DetailRow>
              <DetailRow label="Current Status">
                <Badge
                  variant="outline"
                  className={cn("capitalize", getStatusStyle(dak.status))}
                >
                  {formatDakStatus(dak.status)}
                </Badge>
              </DetailRow>
              <DetailRow label="Pending Days">
                <span className="font-medium">{pendingDays} day{pendingDays === 1 ? "" : "s"}</span>
              </DetailRow>
              <DetailRow label="DAK Source">
                {getSourceName(dak.dak_sources)}
              </DetailRow>
              <DetailRow label="Assignment Type">
                {formatAssignmentType(dak.assignment_type)}
              </DetailRow>
              <DetailRow label="Assignment">
                {dak.assignment_type === "section"
                  ? formatAssignmentLabel(
                      getUnitName(dak.assignment_units),
                      getOfficerName(dak.assigned_officer) === "Not assigned"
                        ? null
                        : getOfficerName(dak.assigned_officer)
                    )
                  : formatAssignmentLabel(
                      getDepartmentName(dak.departments),
                      getOfficerName(dak.assigned_officer) === "Not assigned"
                        ? null
                        : getOfficerName(dak.assigned_officer)
                    )}
              </DetailRow>
              <DetailRow label="Department">
                {getDepartmentName(dak.departments)}
              </DetailRow>
              <DetailRow label="Section">
                {getUnitName(dak.assignment_units)}
              </DetailRow>
              <DetailRow label="Assigned Officer">
                {getOfficerName(dak.assigned_officer)}
              </DetailRow>
              <DetailRow label="Priority">
                <Badge
                  variant="secondary"
                  className={getBadgeClassName(
                    priorityStyles,
                    dak.priority,
                    "bg-muted text-muted-foreground"
                  )}
                >
                  {dak.priority}
                </Badge>
              </DetailRow>
              <DetailRow label="Received Date">
                {formatDakDate(dak.received_date)}
              </DetailRow>
              <DetailRow label="Due Date">
                {formatDakDate(dak.due_date)}
              </DetailRow>
              <DetailRow label="Subject">{dak.subject}</DetailRow>
              <DetailRow label="Sender">{dak.sender}</DetailRow>
              <DetailRow label="Registration Remarks">
                {dak.description?.trim() ? (
                  <span className="whitespace-pre-wrap">{dak.description}</span>
                ) : (
                  <span className="text-muted-foreground">No remarks recorded</span>
                )}
              </DetailRow>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          {showAssignForm && (
            <AssignDakForm
              dakId={dak.id}
              options={assignOptions}
              isReassign={isReassign}
            />
          )}

          {canUpdateStatus && allowedTransitions.length > 0 && (
            <DakStatusForm
              dakId={dak.id}
              currentStatus={dak.status}
              allowedTransitions={allowedTransitions}
            />
          )}
        </div>
      </div>

      <DakDetailTabs
        dakId={dak.id}
        timeline={entries}
        remarks={remarks}
        atrRecords={atrRecords}
        permissions={remarkPermissions}
      />

      <AttachmentCard attachments={attachments} />
    </div>
  );
}
