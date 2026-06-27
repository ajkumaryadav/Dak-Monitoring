"use client";

import { useState } from "react";
import { Clock, FileText, MessageSquare } from "lucide-react";

import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompleteHistoryTimeline } from "@/features/remarks/components/complete-history-timeline";
import { RemarksPanel } from "@/features/remarks/components/remarks-panel";
import { AtrPanel } from "@/features/remarks/components/atr-panel";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import type {
  DakAtrRecord,
  DakRemarkRecord,
} from "@/features/remarks/services/get-remarks";
import { cn } from "@/lib/utils";

type DetailTab = "timeline" | "remarks" | "atr";

interface DakDetailTabsProps {
  dakId: string;
  timeline: DakHistoryEntry[];
  remarks: DakRemarkRecord[];
  atrRecords: DakAtrRecord[];
  permissions: RemarkPermissions;
}

const tabs: { id: DetailTab; label: string; icon: typeof Clock }[] = [
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "remarks", label: "Remarks", icon: MessageSquare },
  { id: "atr", label: "Action Taken Report", icon: FileText },
];

export function DakDetailTabs({
  dakId,
  timeline,
  remarks,
  atrRecords,
  permissions,
}: DakDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("timeline");

  return (
    <Card className="border-primary/15 lg:col-span-5">
      <CardHeader className="border-b border-border/60">
        <CardTitle>DAK History & Correspondence</CardTitle>
        <CardDescription>
          Complete workflow timeline, remarks, and action taken reports
        </CardDescription>
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
      </CardHeader>
      <CardContent className="pt-4">
        {activeTab === "timeline" && (
          <CompleteHistoryTimeline
            timeline={timeline}
            remarks={remarks}
            atrRecords={atrRecords}
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
      </CardContent>
    </Card>
  );
}
