import {
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  FileText,
  GitBranch,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Disabled until the corresponding module is implemented. */
  disabled?: boolean;
}

/** Primary sidebar navigation — business routes are placeholders for future modules. */
export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "DAK Registration",
    href: "/dak",
    icon: FileText,
    disabled: true,
  },
  {
    title: "Workflow",
    href: "/workflow",
    icon: GitBranch,
    disabled: true,
  },
  {
    title: "Timeline",
    href: "/timeline",
    icon: Clock,
    disabled: true,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    disabled: true,
  },
  {
    title: "Escalation",
    href: "/escalation",
    icon: AlertTriangle,
    disabled: true,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    disabled: true,
  },
];

export const appConfig = {
  name: "DAK Monitoring",
  fullName: "District DAK & Administrative Monitoring System",
  shortName: "DDAMS",
  district: "Khairthal-Tijara",
  districtAdministration: "Khairthal-Tijara @ Administration",
} as const;
