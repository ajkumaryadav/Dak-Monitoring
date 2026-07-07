import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Clock,
  Flame,
  FileText,
  Landmark,
  Layers,
  Scale,
  Users,
} from "lucide-react";

import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { ReportLinkCard } from "@/features/reports/components/report-link-card";
import { DAK_SOURCE_WIDGETS } from "@/lib/constants/dak-sources";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

const reportLinks = [
  {
    title: "Pending Report",
    description: "All active DAK awaiting workflow action.",
    footnote: "Filter by source, department, section, status, and date.",
    href: "/dashboard/reports/pending",
    icon: Clock,
    variant: "info" as const,
    tag: "Active queue",
  },
  {
    title: "Overdue Report",
    description: "Cases past SLA due date that are not yet completed.",
    footnote: "Highlight items needing immediate collector attention.",
    href: "/dashboard/reports/pending?overdue=1",
    icon: AlertTriangle,
    variant: "warning" as const,
    tag: "Past due",
  },
  {
    title: "SLA Compliance",
    description: "Active DAK with SLA health — safe, due soon, overdue.",
    footnote: "Track district SLA adherence by priority rules.",
    href: "/dashboard/reports/sla",
    icon: BarChart3,
    variant: "success" as const,
    tag: "SLA",
  },
  {
    title: "Escalation Report",
    description: "DAK escalated to department head, collector, ACP, or ADM.",
    footnote: "Multi-tier escalation beyond assigned officer.",
    href: "/dashboard/reports/escalation",
    icon: AlertTriangle,
    variant: "danger" as const,
    tag: "Escalated",
  },
  {
    title: "ATR Pending",
    description: "Assigned DAK awaiting Action Taken Report from department.",
    footnote: "Track compliance before closure.",
    href: "/dashboard/reports/atr-pending",
    icon: FileText,
    variant: "warning" as const,
    tag: "ATR",
  },
  {
    title: "ATR Submitted",
    description: "DAK with submitted Action Taken Reports.",
    footnote: "Review department responses and attachments.",
    href: "/dashboard/reports/atr-submitted",
    icon: FileText,
    variant: "success" as const,
    tag: "ATR",
  },
  {
    title: "Source-wise Report",
    description: "Pending DAK grouped and filtered by originating source.",
    footnote: "Analyze correspondence channels across the district.",
    href: "/dashboard/reports/pending",
    icon: Layers,
    variant: "primary" as const,
    tag: "By source",
  },
  {
    title: "Department-wise Report",
    description: "Pending workload broken down by department.",
    footnote: "Compare departmental backlog and completion rates.",
    href: "/dashboard/reports/departments",
    icon: Building2,
    variant: "success" as const,
    tag: "By dept",
  },
  {
    title: "Section-wise Report",
    description: "Internal Collectorate section assignment workload.",
    footnote: "Track PA Cell, ADM, Legal, and other section pending items.",
    href: "/dashboard/reports/sections",
    icon: Building2,
    variant: "info" as const,
    tag: "Internal",
  },
  {
    title: "Officer Performance",
    description: "Officer-wise pending, overdue, completed, and average disposal time.",
    footnote: "Accountability metrics by assigned officer.",
    href: "/dashboard/reports/officers",
    icon: Users,
    variant: "primary" as const,
    tag: "Officers",
  },
  {
    title: "CMO Pending Report",
    description: "Pending DAK originating from the Chief Minister's Office.",
    footnote: "High-visibility executive references.",
    href: `/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.CMO)}`,
    icon: Landmark,
    variant: "danger" as const,
    tag: "CMO",
  },
  {
    title: "Jan Sunwai Report",
    description: "Public hearing and Jan Sunwai correspondence.",
    footnote: "Citizen-facing grievance pipeline.",
    href: `/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.JAN_SUNWAI)}`,
    icon: Users,
    variant: "info" as const,
    tag: "Public",
  },
  {
    title: "MLA References Report",
    description: "Pending DAK linked to MLA references.",
    footnote: "Elected representative correspondence.",
    href: `/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.MLA)}`,
    icon: Flame,
    variant: "warning" as const,
    tag: "MLA",
  },
  {
    title: "Court Cases Report",
    description: "Court-related pending correspondence and orders.",
    footnote: "Legal and judicial follow-up items.",
    href: `/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.COURT)}`,
    icon: Scale,
    variant: "danger" as const,
    tag: "Court",
  },
] as const;

export default async function ReportsPage() {
  await requirePermission(PERMISSIONS.REPORTS);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Reports"
        description="District DAK analytics, source-wise insights, and exportable reports."
        icon={BarChart3}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reportLinks.map((report) => (
          <ReportLinkCard key={report.title} {...report} />
        ))}
      </div>

      <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/5 via-background to-background p-5">
        <p className="text-sm font-semibold text-primary">Dashboard Analytics</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Collector dashboard includes source-wise charts, department performance,
          and section workload widgets.
        </p>
        <Link
          href="/dashboard"
          className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
        >
          View dashboard charts →
        </Link>
      </div>
    </div>
  );
}
