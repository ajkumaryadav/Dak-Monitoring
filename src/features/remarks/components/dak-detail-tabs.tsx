"use client";

import { useState } from "react";
import { FileText, MessageSquare } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RemarksPanel } from "@/features/remarks/components/remarks-panel";
import { AtrPanel } from "@/features/remarks/components/atr-panel";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import type {
  DakAtrRecord,
  DakRemarkRecord,
} from "@/features/remarks/services/get-remarks";
import { cn } from "@/lib/utils";

type DetailTab = "remarks" | "atr";

interface DakDetailTabsProps {
  dakId: string;
  remarks: DakRemarkRecord[];
  atrRecords: DakAtrRecord[];
  permissions: RemarkPermissions;
}

const tabs: { id: DetailTab; label: string; icon: typeof MessageSquare }[] = [
  { id: "remarks", label: "Remarks", icon: MessageSquare },
  { id: "atr", label: "Action Taken Report", icon: FileText },
];

export function DakDetailTabs({
  dakId,
  remarks,
  atrRecords,
  permissions,
}: DakDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("remarks");

  return (
    <Card className="border-primary/15 lg:col-span-5">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Remarks & ATR</CardTitle>
        <CardDescription>
          Internal notes, department remarks, and action taken reports
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
