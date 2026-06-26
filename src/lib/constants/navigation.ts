import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  FilePlus2,
  FileText,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/auth/permissions";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Required permission to show this nav item. */
  permission?: Permission;
  /** Disabled until the corresponding module is implemented. */
  disabled?: boolean;
}

/** Primary sidebar navigation for the admin dashboard. */
export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD,
  },
  {
    title: "Register DAK",
    href: "/dashboard/dak/new",
    icon: FilePlus2,
    permission: PERMISSIONS.DAK_ENTRY,
  },
  {
    title: "All DAK",
    href: "/dashboard/dak",
    icon: FileText,
    permission: PERMISSIONS.DAK_VIEW,
  },
  {
    title: "Assignments",
    href: "/dashboard/dak/assignments",
    icon: ClipboardList,
    permission: PERMISSIONS.DAK_ASSIGN,
  },
  {
    title: "Pending DAK",
    href: "/dashboard/dak/pending",
    icon: Clock,
    permission: PERMISSIONS.DAK_VIEW,
  },
  {
    title: "Completed DAK",
    href: "/dashboard/dak/completed",
    icon: CheckCircle2,
    permission: PERMISSIONS.DAK_VIEW,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    permission: PERMISSIONS.REPORTS,
  },
];

export const appConfig = {
  name: "DAK Monitoring",
  fullName: "District DAK & Administrative Monitoring System",
  shortName: "DDAMS",
  district: "Khairthal-Tijara",
  districtAdministration: "Khairthal-Tijara @ Administration",
} as const;
