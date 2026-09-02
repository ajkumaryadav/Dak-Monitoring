"use client";

import { useState } from "react";
import {
  Clock,
  FileCheck2,
  FileText,
  History,
  MessageSquare,
  Paperclip,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttachmentCard } from "@/features/dak/components/attachment-card";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import { DakComplianceWorkflowPanel } from "@/features/dak/components/dak-compliance-workflow-panel";
import { AtrPanel } from "@/features/remarks/components/atr-panel";
import { RemarksPanel } from "@/features/remarks/components/remarks-panel";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import type {
  ComplianceDraftRecord,
  DakAtrRecord,
  DakRemarkRecord,
} from "@/features/remarks/services/get-remarks";
import { DakTimelinePanel } from "@/features/timeline/components/dak-timeline-panel";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";
import { cn } from "@/lib/utils";

type DetailTab =
  | "correspondence"
  | "remarks"
  | "atr"
  | "compliance"
  | "attachments"
  | "activity";

interface DakDetailTabsProps {
  dakId: string;
  dakStatus: string;
  timeline: DakTimelineEvent[];
  remarks: DakRemarkRecord[];
  atrRecords: DakAtrRecord[];
  attachments: DakAttachmentWithUrl[];
  permissions: RemarkPermissions;
  complianceDraft?: ComplianceDraftRecord | null;
  showComplianceActions?: boolean;
  compactTimeline?: boolean;
  defaultTab?: DetailTab;
}

const ALL_TABS: { id: DetailTab; label: string; icon: typeof Clock }[] = [
  { id: "correspondence", label: "Correspondence", icon: Clock },
  { id: "remarks", label: "Remarks", icon: MessageSquare },
  { id: "atr", label: "ATR", icon: FileText },
  { id: "compliance", label: "Compliance", icon: FileCheck2 },
  { id: "attachments", label: "Attachments", icon: Paperclip },
  { id: "activity", label: "Activity Log", icon: History },
];

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      No data available.
      <span className="mt-1 block text-xs">No {label} recorded for this DAK.</span>
    </p>
  );
}

/**
 * Unified correspondence tabs — always render every tab.
 * Empty tabs show “No data available” instead of being removed.
 */
export function DakDetailTabs({
  dakId,
  dakStatus,
  timeline,
  remarks,
  atrRecords,
  attachments,
  permissions,
  complianceDraft = null,
  showComplianceActions = false,
  compactTimeline = true,
  defaultTab = "correspondence",
}: DakDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>(defaultTab);

  return (
    <Card className="border-primary/15">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Correspondence</CardTitle>
        <CardDescription>
          Timeline, remarks, ATR, compliance, attachments, and activity
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          {ALL_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {activeTab === "correspondence" &&
          (timeline.length ? (
            <DakTimelinePanel
              events={timeline}
              compact
              maxItems={compactTimeline ? 8 : undefined}
            />
          ) : (
            <EmptyState label="correspondence events" />
          ))}

        {activeTab === "remarks" &&
          (remarks.length || permissions.canAddRemark ? (
            <RemarksPanel
              dakId={dakId}
              remarks={remarks}
              permissions={permissions}
            />
          ) : (
            <EmptyState label="remarks" />
          ))}

        {activeTab === "atr" &&
          (atrRecords.length || permissions.canSubmitAtr ? (
            <AtrPanel
              dakId={dakId}
              atrRecords={atrRecords}
              permissions={permissions}
            />
          ) : (
            <EmptyState label="ATR records" />
          ))}

        {activeTab === "compliance" &&
          (showComplianceActions ? (
            <DakComplianceWorkflowPanel
              dakId={dakId}
              status={dakStatus}
              draft={complianceDraft}
              submittedRecords={atrRecords}
            />
          ) : atrRecords.length ? (
            <AtrPanel
              dakId={dakId}
              atrRecords={atrRecords}
              permissions={{
                ...permissions,
                canSubmitAtr: false,
                canSubmitCompliance: false,
              }}
            />
          ) : (
            <EmptyState label="compliance uploads" />
          ))}

        {activeTab === "attachments" &&
          (attachments.length ? (
            <AttachmentCard attachments={attachments} embedded scrollable />
          ) : (
            <EmptyState label="attachments" />
          ))}

        {activeTab === "activity" &&
          (timeline.length ? (
            <DakTimelinePanel events={timeline} compact />
          ) : (
            <EmptyState label="activity" />
          ))}
      </CardContent>
    </Card>
  );
}
