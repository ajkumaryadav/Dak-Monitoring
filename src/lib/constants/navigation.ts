import {
  Activity,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileCheck2,
  FilePlus2,
  FileText,
  History,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/auth/permissions";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import type { UserRole } from "@/types";

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
    title: "Pending Assignment",
    href: "/dashboard/dak/assignments",
    icon: ClipboardList,
    permission: PERMISSIONS.DAK_ASSIGN,
  },
  {
    title: "Assigned DAK",
    href: "/dashboard/dak/assigned",
    icon: ListChecks,
    permission: PERMISSIONS.DAK_VIEW,
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
    title: "Pending Approval",
    href: "/dashboard/dak/pending-approval",
    icon: ShieldCheck,
    permission: PERMISSIONS.DAK_ASSIGN,
  },
  {
    title: "ATR / Compliance Received",
    href: "/dashboard/dak/atr-compliance",
    icon: FileCheck2,
    permission: PERMISSIONS.DAK_ASSIGN,
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks",
    icon: ListTodo,
    permission: PERMISSIONS.TASKS,
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
    title: "Activity Log",
    href: "/dashboard/activity",
    icon: Activity,
    permission: PERMISSIONS.ACTIVITY,
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
    items: mainNavItems.slice(1, 10),
  },
  {
    label: "Tasks",
    items: [mainNavItems[10]],
  },
  {
    label: "Reports",
    items: mainNavItems.slice(11, 14),
  },
  {
    label: "Administration",
    items: mainNavItems.slice(14),
  },
];

const ROLE_NAV_HREFS: Partial<Record<UserRole, readonly string[]>> = {
  dak_operator: [
    "/dashboard",
    "/dashboard/dak/new",
    "/dashboard/dak",
    "/dashboard/dak/assigned",
    "/dashboard/notifications",
  ],
  collector: [
    "/dashboard",
    "/dashboard/dak/assignments",
    "/dashboard/dak/atr-compliance",
    "/dashboard/dak/assigned",
    "/dashboard/tasks",
    "/dashboard/reports",
    "/dashboard/notifications",
    "/dashboard/admin/users",
  ],
  /** Same curated Collector menu, without User Management. */
  adm: [
    "/dashboard",
    "/dashboard/dak/assignments",
    "/dashboard/dak/atr-compliance",
    "/dashboard/dak/assigned",
    "/dashboard/tasks",
    "/dashboard/reports",
    "/dashboard/notifications",
  ],
  acp: [
    "/dashboard",
    "/dashboard/dak/assigned",
    "/dashboard/dak/pending",
    "/dashboard/tasks",
    "/dashboard/reports",
    "/dashboard/notifications",
    "/dashboard/admin/users",
  ],
};

const ROLE_NAV_TITLE_OVERRIDES: Partial<
  Record<UserRole, Partial<Record<string, string>>>
> = {
  dak_operator: {
    "/dashboard/dak/assigned": "Forwarded & Tracking",
  },
  acp: {
    "/dashboard/tasks": "Task Monitoring",
  },
};

function buildNavItemMap(): Map<string, NavItem> {
  return new Map(mainNavItems.map((item) => [item.href, item]));
}

const navItemByHref = buildNavItemMap();

function groupNavItems(items: NavItem[], role?: UserRole): NavGroup[] {
  const overview = items.filter((item) => item.href === "/dashboard");
  const dakOps = items.filter((item) =>
    item.href.startsWith("/dashboard/dak")
  );
  const tasks = items.filter((item) => item.href.startsWith("/dashboard/tasks"));
  const reports = items.filter(
    (item) =>
      item.href.startsWith("/dashboard/reports") ||
      item.href.startsWith("/dashboard/audit") ||
      item.href.startsWith("/dashboard/activity")
  );
  const admin = items.filter(
    (item) =>
      item.href.startsWith("/dashboard/admin") ||
      item.href.startsWith("/dashboard/notifications")
  );

  const dakGroupLabel =
    role === "dak_operator" ? "DAK Registration" : "DAK Operations";

  const groups: NavGroup[] = [];
  if (overview.length) groups.push({ label: "Dashboard", items: overview });
  if (dakOps.length) groups.push({ label: dakGroupLabel, items: dakOps });
  if (tasks.length) groups.push({ label: "Tasks", items: tasks });
  if (reports.length) groups.push({ label: "Reports", items: reports });
  if (admin.length) {
    const adminLabel = role === "dak_operator" ? "Notifications" : "Administration";
    groups.push({ label: adminLabel, items: admin });
  }
  return groups;
}

/** Role-aware navigation — Collector, ADM, and ACP use curated menus; others use permission filtering. */
export function getNavGroupsForRole(role: UserRole): NavGroup[] {
  const roleHrefs = ROLE_NAV_HREFS[role];

  if (roleHrefs) {
    const titleOverrides = ROLE_NAV_TITLE_OVERRIDES[role] ?? {};
    const items = roleHrefs
      .map((href) => {
        const base = navItemByHref.get(href);
        if (!base) return null;
        const title = titleOverrides[href] ?? base.title;
        return title === base.title ? base : { ...base, title };
      })
      .filter((item): item is NavItem => item !== null);

    return groupNavItems(items, role);
  }

  const visibleItems = mainNavItems.filter((item) => {
    if (item.disabled) return true;
    if (!item.permission) return true;
    return hasPermission(role, item.permission);
  });

  return mainNavGroups
    .map((group) => ({
      ...group,
      label:
        role === "dak_operator" && group.label === "DAK Operations"
          ? "DAK Registration"
          : role === "dak_operator" && group.label === "Administration"
            ? "Notifications"
            : group.label,
      items: group.items.filter((item) => visibleItems.includes(item)),
    }))
    .filter((group) => group.items.length > 0);
}

export const appConfig = {
  name: "DAK Monitoring System",
  fullName: "District DAK & Administrative Monitoring System",
  shortName: "Rajasthan Government · District Administration",
  district: "Khairthal-Tijara",
  districtAdministration: "Khairthal-Tijara @ Administration",
  districtTagline: "District Governance · Administrative Monitoring",
  supportEmail: "dlo.doit.khairthal@rajasthan.gov.in",
  portalIpCode: "33217",
  copyrightHolder: "DOIT&C Khairthal-Tijara",
} as const;
