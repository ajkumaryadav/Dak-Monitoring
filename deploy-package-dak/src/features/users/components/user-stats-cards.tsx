import Link from "next/link";
import { UserCheck, UserMinus, Users } from "lucide-react";

import { StatCard } from "@/features/dashboard/components/stat-card";
import type { UserStatsSummary } from "@/features/users/services/get-users";

interface UserStatsCardsProps {
  stats: UserStatsSummary;
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Link href="/dashboard/admin/users">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={Users}
          variant="primary"
          description="All registered accounts"
        />
      </Link>
      <Link href="/dashboard/admin/users">
        <StatCard
          title="Active Users"
          value={stats.active}
          icon={UserCheck}
          variant="info"
          description="Enabled and can sign in"
        />
      </Link>
      <Link href="/dashboard/admin/users">
        <StatCard
          title="Disabled Users"
          value={stats.disabled}
          icon={UserMinus}
          variant="warning"
          description="Accounts currently disabled"
        />
      </Link>
    </div>
  );
}
