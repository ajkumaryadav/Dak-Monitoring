import { Building2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { PendingReportTable } from "@/features/reports/components/pending-report-table";
import { fetchSectionReport } from "@/features/reports/services/pending-report";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export default async function SectionReportPage() {
  await requirePermission(PERMISSIONS.REPORTS);

  const user = await getSessionUser();
  if (!user) return null;

  const rows = await fetchSectionReport(user);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Section-wise Report"
        description="Pending DAK assigned to internal Collectorate sections."
        icon={Building2}
      />

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>Internal Section Pending Entries</CardTitle>
          <CardDescription>
            {rows.length} section-assigned pending record
            {rows.length === 1 ? "" : "s"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PendingReportTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
