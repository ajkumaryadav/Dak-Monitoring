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
import { ReportLinkCard } from "@/features/reports/components/report-link-card";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

const reportLinks = [
  {
    title: "Pending Report",
    description: "All active DAK awaiting workflow action.",
    footnote: "Sort, filter, and paginate pending correspondence.",
    href: "/dashboard/reports/pending",
    icon: Clock,
    variant: "info" as const,
    tag: "Active queue",
  },
  {
    title: "Overdue Report",
    description: "Cases past due date that are not yet completed.",
    footnote: "Highlight items needing immediate collector attention.",
    href: "/dashboard/reports/pending?overdue=1",
    icon: AlertTriangle,
    variant: "warning" as const,
    tag: "Past due",
  },
  {
    title: "Priority Report",
    description: "Filter pending DAK by urgent or immediate priority.",
    footnote: "Focus on high-priority escalations first.",
    href: "/dashboard/reports/pending?priority=urgent",
    icon: Flame,
    variant: "danger" as const,
    tag: "Urgent",
  },
  {
    title: "Department Report",
    description: "Pending workload broken down by department.",
    footnote: "Compare departmental backlog and completion rates.",
    href: "/dashboard/reports/pending",
    icon: Building2,
    variant: "success" as const,
    tag: "By dept",
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
          <ReportLinkCard key={report.title} {...report} />
        ))}
      </div>

      <Card className="border-primary/15 bg-gradient-to-r from-primary/5 via-background to-background">
        <CardHeader>
          <CardTitle className="text-base text-primary">
            Dashboard Analytics
          </CardTitle>
          <CardDescription>
            Collector dashboard includes priority distribution, status pipeline,
            and department performance charts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View dashboard charts →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
