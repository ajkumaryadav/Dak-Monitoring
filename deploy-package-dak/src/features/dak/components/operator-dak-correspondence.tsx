"use client";

import { AlertCircle, Clock, Paperclip } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttachmentCard } from "@/features/dak/components/attachment-card";
import { DakRecallButton } from "@/features/dak/components/dak-recall-button";
import { DakReforwardButton } from "@/features/dak/components/dak-reforward-button";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import type { OperatorReturnNotice } from "@/features/dak/lib/operator-dak-access";
import { DakTimelinePanel } from "@/features/timeline/components/dak-timeline-panel";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";

interface OperatorDakCorrespondenceProps {
  timeline: DakTimelineEvent[];
  attachments: DakAttachmentWithUrl[];
  returnNotice: OperatorReturnNotice | null;
  dakId?: string;
  dakNumber?: string;
  status?: string;
  isRecalled?: boolean;
}

/** Minimal correspondence panel — registration workflow and original scan only. */
export function OperatorDakCorrespondence({
  timeline,
  attachments,
  returnNotice,
  dakId,
  dakNumber,
  status,
  isRecalled = false,
}: OperatorDakCorrespondenceProps) {
  return (
    <div className="space-y-5">
      {dakId && dakNumber && (
        isRecalled ? (
          <DakReforwardButton
            dakId={dakId}
            dakNumber={dakNumber}
            asCard
          />
        ) : status ? (
          <DakRecallButton
            dakId={dakId}
            dakNumber={dakNumber}
            status={status}
            asCard
          />
        ) : null
      )}

      {returnNotice && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {returnNotice.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {returnNotice.body}
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="border-primary/15">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-primary" />
            Registration Workflow
          </CardTitle>
          <CardDescription>
            Registration events only — internal processing is not shown
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <DakTimelinePanel
            events={timeline}
            compact
            description="Registration and forwarding events"
          />
          <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground">
            Internal Processing — visible only to Collector/ADM and concerned
            department
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/15">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="size-4 text-primary" />
            Original DAK Attachment
          </CardTitle>
          <CardDescription>
            Scanned document uploaded during registration
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <AttachmentCard attachments={attachments} embedded />
        </CardContent>
      </Card>
    </div>
  );
}
