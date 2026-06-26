import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Clock,
  Flame,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

const reportLinks = [
  {
    title: "Pending Report",
    description: "All active DAK awaiting workflow action.",
    href: "/dashboard/reports/pending",
    icon: Clock,
  },
  {
    title: "Overdue Report",
    description: "Cases past due date that are not yet completed.",
    href: "/dashboard/reports/pending?overdue=1",
    icon: AlertTriangle,
  },
  {
    title: "Priority Report",
    description: "Filter pending DAK by urgent or immediate priority.",
    href: "/dashboard/reports/pending?priority=urgent",
    icon: Flame,
  },
  {
    title: "Department Report",
    description: "Pending workload broken down by department.",
    href: "/dashboard/reports/pending",
    icon: Building2,
  },
] as const;

export default async function ReportsPage() {
  await requirePermission(PERMISSIONS.REPORTS);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Reports"
        description="District DAK analytics and exportable reports."
        icon={BarChart3}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {reportLinks.map((report) => (
          <Link key={report.title} href={report.href}>
            <Card className="h-full border-primary/15 transition-colors hover:border-primary/40 hover:bg-muted/20">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <report.icon className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {report.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Tables support sorting, filtering, and pagination. Excel/PDF
                  export coming soon.
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-border/60 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Dashboard Analytics</CardTitle>
          <CardDescription>
            Collector dashboard includes Recharts for priority distribution,
            status pipeline, and department performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary hover:underline"
          >
            View dashboard charts →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
