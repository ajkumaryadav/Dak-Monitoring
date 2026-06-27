"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AtrForm } from "@/features/remarks/components/atr-form";
import { AtrList } from "@/features/remarks/components/atr-list";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import type { DakAtrRecord } from "@/features/remarks/services/get-remarks";

interface AtrPanelProps {
  dakId: string;
  atrRecords: DakAtrRecord[];
  permissions: RemarkPermissions;
}

export function AtrPanel({ dakId, atrRecords, permissions }: AtrPanelProps) {
  return (
    <div className="space-y-5">
      {permissions.canSubmitAtr && (
        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Submit Action Taken Report</CardTitle>
            <CardDescription>
              Describe action taken and optionally attach supporting document (PDF, image, or Word).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <AtrForm dakId={dakId} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Action Taken Reports</CardTitle>
          <CardDescription>
            {atrRecords.length
              ? `${atrRecords.length} submission${atrRecords.length === 1 ? "" : "s"}`
              : "No ATR submitted yet"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <AtrList atrRecords={atrRecords} />
        </CardContent>
      </Card>
    </div>
  );
}
