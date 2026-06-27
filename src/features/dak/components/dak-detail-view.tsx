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
import { AssignDakForm } from "@/features/dak/components/assign-dak-form";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { DakStatusForm } from "@/features/dak/components/dak-status-form";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import { getAllowedTransitions } from "@/features/dak/lib/workflow";
import {
  formatDakDate,
  formatDakStatus,
  getDepartmentName,
  getStatusStyle,
  priorityStyles,
  getBadgeClassName,
} from "@/features/dak/lib/dak-display";
import type { AssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import type { DakDetail } from "@/features/dak/services/get-dak-by-id";
import { SlaStatusBadge } from "@/features/sla/lib/sla-display";
import { getEscalationLevelLabel } from "@/features/sla/lib/sla-constants";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";
import { cn } from "@/lib/utils";

interface DakDetailViewProps {
  dak: DakDetail;
  timeline: DakTimelineEvent[];
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
            <CardTitle>DAK Summary</CardTitle>
            <CardDescription>
              Subject, status, priority, and department allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Subject">
                <span className="font-medium">{dak.subject}</span>
              </DetailRow>
              <DetailRow label="Status">
                <Badge
                  variant="outline"
                  className={cn("capitalize", getStatusStyle(dak.status))}
                >
                  {formatDakStatus(dak.status)}
                </Badge>
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
              <DetailRow label="Department">
                {getDepartmentName(dak.departments)}
              </DetailRow>
              <DetailRow label="Received Date">
                {formatDakDate(dak.received_date)}
              </DetailRow>
              <DetailRow label="SLA Due Date">
                <div className="flex flex-wrap items-center gap-2">
                  {formatDakDate(dak.sla_due_date ?? dak.due_date)}
                  <SlaStatusBadge
                    entry={{
                      slaDueDate: dak.sla_due_date,
                      dueDate: dak.due_date,
                      escalationLevel: dak.escalation_level,
                    }}
                  />
                  {dak.escalation_level >= 1 && (
                    <Badge variant="outline" className="border-red-950/30 bg-red-950/10 text-red-950 dark:text-red-300">
                      {getEscalationLevelLabel(dak.escalation_level)}
                    </Badge>
                  )}
                </div>
              </DetailRow>
              <DetailRow label="Due Date">
                {formatDakDate(dak.due_date)}
              </DetailRow>
              <DetailRow label="Sender">{dak.sender}</DetailRow>
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
        timeline={timeline}
        remarks={remarks}
        atrRecords={atrRecords}
        attachments={attachments}
        permissions={remarkPermissions}
      />
    </div>
  );
}

