import { Layers } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { PendingReportTable } from "@/features/reports/components/pending-report-table";
import { fetchSourceReport } from "@/features/reports/services/pending-report";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

interface SourceReportPageProps {
  searchParams: Promise<{ name?: string }>;
}

export default async function SourceReportPage({
  searchParams,
}: SourceReportPageProps) {
  await requirePermission(PERMISSIONS.REPORTS);

  const user = await getSessionUser();
  if (!user) return null;

  const { name } = await searchParams;
  const sourceName = name?.trim() || "Unknown";

  const rows = await fetchSourceReport(user, sourceName);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={`${sourceName} Report`}
        description={`Pending DAK originating from ${sourceName}.`}
        icon={Layers}
      />

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>{sourceName} Pending Entries</CardTitle>
          <CardDescription>
            {rows.length} pending record{rows.length === 1 ? "" : "s"} from this
            source.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PendingReportTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
