import Link from "next/link";
import { ArrowLeft, Clock, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { AttachmentCard } from "@/features/dak/components/attachment-card";
import { DakStatusForm } from "@/features/dak/components/dak-status-form";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import { getAllowedTransitions } from "@/features/dak/lib/workflow";
import {
  formatDakDate,
  formatDakDateTime,
  formatDakStatus,
  getBadgeClassName,
  getDepartmentName,
  priorityStyles,
  statusStyles,
} from "@/features/dak/lib/dak-display";
import type {
  DakDetail,
  DakTimelineEntry,
} from "@/features/dak/services/get-dak-by-id";
import { cn } from "@/lib/utils";

interface DakDetailViewProps {
  dak: DakDetail;
  timeline: DakTimelineEntry[];
  attachments: DakAttachmentWithUrl[];
  canUpdateStatus: boolean;
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-3 last:border-0 sm:grid-cols-[140px_1fr] sm:gap-4">
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
      action: "DAK Registered",
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
  canUpdateStatus,
}: DakDetailViewProps) {
  const entries = buildTimelineEntries(dak, timeline);
  const allowedTransitions = getAllowedTransitions(dak.status);

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
              Correspondence information and current workflow status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="DAK Number">
                <span className="font-semibold text-primary">
                  {dak.dak_number}
                </span>
              </DetailRow>
              <DetailRow label="Subject">{dak.subject}</DetailRow>
              <DetailRow label="Sender">{dak.sender}</DetailRow>
              <DetailRow label="Department">
                {getDepartmentName(dak.departments)}
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
              <DetailRow label="Status">
                <Badge
                  variant="outline"
                  className={getBadgeClassName(
                    statusStyles,
                    dak.status,
                    "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {formatDakStatus(dak.status)}
                </Badge>
              </DetailRow>
              <DetailRow label="Due Date">
                {formatDakDate(dak.due_date)}
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
          {canUpdateStatus && (
            <DakStatusForm
              dakId={dak.id}
              currentStatus={dak.status}
              allowedTransitions={allowedTransitions}
            />
          )}

          <Card className="border-primary/15 bg-gradient-to-br from-muted/40 via-background to-background">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Clock className="size-4" />
              </div>
              <div>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>
                  Workflow history and status updates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ol className="relative space-y-0 border-l border-primary/20 pl-6">
              {entries.map((entry, index) => {
                const isLast = index === entries.length - 1;

                return (
                  <li key={entry.id} className={cn("relative pb-6", isLast && "pb-0")}>
                    <span
                      className={cn(
                        "absolute top-1 -left-[calc(0.75rem+1px)] size-3 rounded-full ring-4 ring-background",
                        isLast ? "bg-primary" : "bg-primary/40"
                      )}
                    />
                    <p className="text-sm font-medium text-foreground">
                      {entry.action}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDakDateTime(entry.created_at)}
                      {entry.actor_name ? ` · ${entry.actor_name}` : ""}
                    </p>
                    {entry.remarks?.trim() && (
                      <p className="mt-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                        {entry.remarks}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
        </div>
      </div>

      <AttachmentCard attachments={attachments} />
    </div>
  );
}
