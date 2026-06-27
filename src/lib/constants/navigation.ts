import {
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  FilePlus2,
  FileText,
  History,
  LayoutDashboard,
  Users,
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

export interface NavGroup {
  label: string;
  items: NavItem[];
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
  {
    title: "Audit History",
    href: "/dashboard/audit",
    icon: History,
    permission: PERMISSIONS.AUDIT,
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    permission: PERMISSIONS.NOTIFICATIONS,
  },
  {
    title: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    permission: PERMISSIONS.USERS,
  },
];

/** Sidebar sections with grouped navigation labels. */
export const mainNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [mainNavItems[0]],
  },
  {
    label: "DAK Operations",
    items: mainNavItems.slice(1, 6),
  },
  {
    label: "Analytics",
    items: mainNavItems.slice(6, 9),
  },
  {
    label: "Administration",
    items: mainNavItems.slice(9),
  },
];

export const appConfig = {
  name: "DAK Monitoring",
  fullName: "District DAK & Administrative Monitoring System",
  shortName: "DDAMS",
  district: "Khairthal-Tijara",
  districtAdministration: "Khairthal-Tijara @ Administration",
} as const;
