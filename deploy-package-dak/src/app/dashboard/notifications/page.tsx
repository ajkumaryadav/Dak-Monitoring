import { Bell } from "lucide-react";

import { NotificationsPageClient } from "@/features/notifications/components/notifications-page-client";
import {
  getUnreadNotificationCount,
  getUserNotifications,
} from "@/features/notifications/services/notifications";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requirePermission(PERMISSIONS.NOTIFICATIONS);

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(user, { limit: 100 }),
    getUnreadNotificationCount(user),
  ]);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Notifications"
        description="DAK assignments, status updates, completions, and overdue alerts."
        icon={Bell}
      />

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.03] via-background to-background p-5 shadow-sm">
        <NotificationsPageClient
          user={user}
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
        />
      </div>
    </div>
  );
}
