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
import { AssignDakForm } from "@/features/dak/components/assign-dak-form";
import { AttachmentCard } from "@/features/dak/components/attachment-card";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { DakStatusForm } from "@/features/dak/components/dak-status-form";
import { DakTimeline } from "@/features/dak/components/dak-timeline";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import {
  canAssignStatus,
  getAllowedTransitions,
} from "@/features/dak/lib/workflow";
import {
  formatDakDate,
  formatDakStatus,
  getDepartmentName,
  getOfficerName,
  getStatusStyle,
  priorityStyles,
  getBadgeClassName,
} from "@/features/dak/lib/dak-display";
import type { DepartmentOption } from "@/features/dak/services/get-departments";
import type {
  DakDetail,
  DakTimelineEntry,
} from "@/features/dak/services/get-dak-by-id";
import { cn } from "@/lib/utils";

interface DakDetailViewProps {
  dak: DakDetail;
  timeline: DakTimelineEntry[];
  attachments: DakAttachmentWithUrl[];
  departments: DepartmentOption[];
  canAssign: boolean;
  canUpdateStatus: boolean;
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
  logs: DakTimelineEntry[]
): DakTimelineEntry[] {
  if (logs.length > 0) {
    return logs;
  }

  return [
    {
      id: "registered",
      action: "DAK created",
      remarks: dak.description,
      created_at: dak.created_at,
      actor_name: null,
    },
  ];
}

export function DakDetailView({
  dak,
  timeline,
  attachments,
  departments,
  canAssign,
  canUpdateStatus,
}: DakDetailViewProps) {
  const entries = buildTimelineEntries(dak, timeline);
  const allowedTransitions = getAllowedTransitions(dak.status);
  const showAssignForm = canAssign && canAssignStatus(dak.status);

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
              Current status, assignment, and correspondence information
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
              <DetailRow label="Assigned Department">
                {getDepartmentName(dak.departments)}
              </DetailRow>
              <DetailRow label="Assigned Officer">
                {getOfficerName(dak.assigned_officer)}
              </DetailRow>
              <DetailRow label="Due Date">
                {formatDakDate(dak.due_date)}
              </DetailRow>
              <DetailRow label="Subject">{dak.subject}</DetailRow>
              <DetailRow label="Sender">{dak.sender}</DetailRow>
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
              <DetailRow label="Remarks">
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
            <AssignDakForm dakId={dak.id} departments={departments} />
          )}

          {canUpdateStatus && allowedTransitions.length > 0 && (
            <DakStatusForm
              dakId={dak.id}
              currentStatus={dak.status}
              allowedTransitions={allowedTransitions}
            />
          )}

          <DakTimeline entries={entries} />
        </div>
      </div>

      <AttachmentCard attachments={attachments} />
    </div>
  );
}
