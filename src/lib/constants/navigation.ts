import {
  BarChart3,
  CheckCircle2,
  Clock,
  FilePlus2,
  FileText,
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

/** Primary sidebar navigation for the admin dashboard. */
export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Register DAK",
    href: "/dashboard/dak/new",
    icon: FilePlus2,
  },
  {
    title: "All DAK",
    href: "/dashboard/dak",
    icon: FileText,
  },
  {
    title: "Pending DAK",
    href: "/dashboard/dak/pending",
    icon: Clock,
  },
  {
    title: "Completed DAK",
    href: "/dashboard/dak/completed",
    icon: CheckCircle2,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
];

export const appConfig = {
  name: "DAK Monitoring",
  fullName: "District DAK & Administrative Monitoring System",
  shortName: "DDAMS",
  district: "Khairthal-Tijara",
  districtAdministration: "Khairthal-Tijara @ Administration",
} as const;
