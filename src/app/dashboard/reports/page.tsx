import { BarChart3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

export default async function ReportsPage() {
  await requirePermission(PERMISSIONS.REPORTS);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Reports"
        description="District DAK analytics and exportable reports."
        icon={BarChart3}
      />

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>Reports Module</CardTitle>
          <CardDescription>
            Detailed reporting and export features will be available in a future
            release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the dashboard metrics and DAK list views for current monitoring
            needs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
