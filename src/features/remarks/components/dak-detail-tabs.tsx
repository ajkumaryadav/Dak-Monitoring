"use client";

import { useState } from "react";
import { Clock, FileText, MessageSquare, Paperclip } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AttachmentCard } from "@/features/dak/components/attachment-card";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import { AtrPanel } from "@/features/remarks/components/atr-panel";
import { RemarksPanel } from "@/features/remarks/components/remarks-panel";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import type {
  DakAtrRecord,
  DakRemarkRecord,
} from "@/features/remarks/services/get-remarks";
import { DakTimelinePanel } from "@/features/timeline/components/dak-timeline-panel";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";
import { cn } from "@/lib/utils";

type DetailTab = "timeline" | "remarks" | "atr" | "attachments";

interface DakDetailTabsProps {
  dakId: string;
  timeline: DakTimelineEvent[];
  remarks: DakRemarkRecord[];
  atrRecords: DakAtrRecord[];
  attachments: DakAttachmentWithUrl[];
  permissions: RemarkPermissions;
  /** Process-driven workflow: timeline + attachments only (no separate remark/ATR tabs). */
  complianceMode?: boolean;
  /** Pending assignment: timeline only — no correspondence or ATR. */
  assignmentMode?: boolean;
  /** Limit timeline to latest entries with expand control. */
  compactTimeline?: boolean;
  defaultTab?: DetailTab;
}

const allTabs: { id: DetailTab; label: string; icon: typeof Clock }[] = [
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "remarks", label: "Remarks", icon: MessageSquare },
  { id: "atr", label: "ATR", icon: FileText },
  { id: "attachments", label: "Attachments", icon: Paperclip },
];

export function DakDetailTabs({
  dakId,
  timeline,
  remarks,
  atrRecords,
  attachments,
  permissions,
  complianceMode = false,
  assignmentMode = false,
  compactTimeline = false,
  defaultTab = "timeline",
}: DakDetailTabsProps) {
  const tabs = assignmentMode
    ? allTabs.filter((tab) => tab.id === "timeline")
    : complianceMode
      ? allTabs.filter((tab) => tab.id === "timeline")
      : allTabs;

  const [activeTab, setActiveTab] = useState<DetailTab>(defaultTab);

  const cardTitle = assignmentMode
    ? "Audit Timeline"
    : complianceMode
      ? "Audit Timeline"
      : "DAK Correspondence";

  const cardDescription = assignmentMode
    ? "Recent workflow events for assignment review"
    : complianceMode
      ? "Read-only workflow history"
      : "Workflow timeline, remarks, action taken reports, and attachments";

  return (
    <Card className="border-primary/15 lg:col-span-5">
      <CardHeader className="border-b border-border/60">
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
        {!complianceMode && !assignmentMode && (
          <div className="flex flex-wrap gap-2 pt-2">
            {tabs.map((tab) => {
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
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {activeTab === "timeline" && (
          <DakTimelinePanel
            events={timeline}
            compact
            maxItems={compactTimeline ? 5 : undefined}
          />
        )}
        {activeTab === "remarks" && (
          <RemarksPanel
            dakId={dakId}
            remarks={remarks}
            permissions={permissions}
          />
        )}
        {activeTab === "atr" && (
          <AtrPanel
            dakId={dakId}
            atrRecords={atrRecords}
            permissions={permissions}
          />
        )}
        {activeTab === "attachments" && (
          <AttachmentCard attachments={attachments} embedded scrollable />
        )}
      </CardContent>
    </Card>
  );
}
