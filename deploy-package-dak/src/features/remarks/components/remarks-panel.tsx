"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddRemarkForm } from "@/features/remarks/components/add-remark-form";
import { RemarkList } from "@/features/remarks/components/remark-list";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import type { DakRemarkRecord } from "@/features/remarks/services/get-remarks";

interface RemarksPanelProps {
  dakId: string;
  remarks: DakRemarkRecord[];
  permissions: RemarkPermissions;
}

export function RemarksPanel({ dakId, remarks, permissions }: RemarksPanelProps) {
  const canAdd = permissions.allowedRemarkTypes.length > 0;

  return (
    <div className="space-y-5">
      {canAdd && (
        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Add Remark</CardTitle>
            <CardDescription>
              {permissions.canAddInternalNote
                ? "Add remarks and internal notes visible to district administration."
                : permissions.canAddDepartmentRemark
                  ? "Add remarks on this DAK for your department."
                  : "Add remarks on this DAK."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <AddRemarkForm dakId={dakId} permissions={permissions} />
          </CardContent>
        </Card>
      )}

      {permissions.isReadOnly && (
        <p className="text-sm text-muted-foreground">
          You have read-only access to remarks on this DAK.
        </p>
      )}

      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Remarks History</CardTitle>
          <CardDescription>
            {remarks.length
              ? `${remarks.length} remark${remarks.length === 1 ? "" : "s"}`
              : "No remarks yet"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <RemarkList remarks={remarks} />
        </CardContent>
      </Card>
    </div>
  );
}
