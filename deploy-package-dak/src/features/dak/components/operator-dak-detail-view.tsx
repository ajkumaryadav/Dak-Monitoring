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
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { OperatorDakCorrespondence } from "@/features/dak/components/operator-dak-correspondence";
import {
  formatDakDate,
  formatDakStatus,
  getSourceName,
  getStatusStyle,
} from "@/features/dak/lib/dak-display";
import type { OperatorReturnNotice } from "@/features/dak/lib/operator-dak-access";
import type { DakDetail } from "@/features/dak/services/get-dak-by-id";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";
import { cn } from "@/lib/utils";

interface OperatorDakDetailViewProps {
  dak: DakDetail;
  timeline: DakTimelineEvent[];
  attachments: DakAttachmentWithUrl[];
  returnNotice: OperatorReturnNotice | null;
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

function getOperatorStatusLabel(status: string): string {
  if (status === "received") {
    return "Registered / With Collector";
  }

  return formatDakStatus(status);
}

/** Registry-clerk view — registration details and limited workflow only. */
export function OperatorDakDetailView({
  dak,
  timeline,
  attachments,
  returnNotice,
}: OperatorDakDetailViewProps) {
  const lastRecallOrForwardEvent = timeline.find((e) => {
    const meta = (e.metadata as Record<string, unknown>) ?? {};
    return (
      meta.recalled_by_operator === true ||
      meta.return_to_registry === true ||
      meta.forwarded_to_collector === true ||
      e.actionType === "dak_assigned" ||
      /assigned/i.test(e.actionTitle)
    );
  });

  const isCurrentlyRecalled =
    (lastRecallOrForwardEvent?.metadata as Record<string, unknown>)?.recalled_by_operator === true ||
    (lastRecallOrForwardEvent?.metadata as Record<string, unknown>)?.return_to_registry === true;

  return (
    <div className="space-y-6">
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

      <DakPageHeader
        title={dak.dak_number}
        description={dak.subject}
        icon={FileText}
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background lg:col-span-2">
          <CardHeader className="border-b border-border/60">
            <CardTitle>Registration Details</CardTitle>
            <CardDescription>
              Basic information captured at diary intake
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Subject">
                <span className="font-medium">{dak.subject}</span>
              </DetailRow>
              <DetailRow label="Status">
                {isCurrentlyRecalled ? (
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                  >
                    Recalled to Registry
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className={cn("capitalize", getStatusStyle(dak.status))}
                  >
                    {getOperatorStatusLabel(dak.status)}
                  </Badge>
                )}
              </DetailRow>
              <DetailRow label="Received Date">
                {formatDakDate(dak.received_date)}
              </DetailRow>
              <DetailRow label="Sender">{dak.sender}</DetailRow>
              {dak.applicant_mobile && (
                <DetailRow label="Applicant Mobile">
                  {dak.applicant_mobile}
                </DetailRow>
              )}
              {dak.sender_address && (
                <DetailRow label="Sender Address">{dak.sender_address}</DetailRow>
              )}
              {dak.applicant_reference && (
                <DetailRow label="Reference No.">
                  {dak.applicant_reference}
                </DetailRow>
              )}
              <DetailRow label="DAK Source">
                {getSourceName(dak.dak_sources)}
              </DetailRow>
              {dak.description && (
                <DetailRow label="Remarks">{dak.description}</DetailRow>
              )}
            </dl>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <OperatorDakCorrespondence
            timeline={timeline}
            attachments={attachments}
            returnNotice={returnNotice}
            dakId={dak.id}
            dakNumber={dak.dak_number}
            status={dak.status}
            isRecalled={isCurrentlyRecalled}
          />
        </div>
      </div>
    </div>
  );
}
