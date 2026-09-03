"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  FileText,
  KeyRound,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  ListTodo,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";

import {
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
} from "@/features/notifications/lib/notification-types";
import type { NotificationRecord } from "@/features/notifications/lib/notification-models";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const typeIcons: Record<NotificationType, typeof Bell> = {
  dak_created: FilePlus2,
  dak_assigned: ClipboardList,
  dak_reassigned: ArrowRightLeft,
  dak_completed: CheckCircle2,
  status_updated: Bell,
  dak_overdue: AlertTriangle,
  sla_due_tomorrow: CalendarClock,
  dak_escalated: ShieldAlert,
  user_created: UserPlus,
  password_reset: KeyRound,
  user_disabled: UserX,
  user_enabled: UserCheck,
  remark_added: MessageSquare,
  atr_submitted: FileText,
  transfer_requested: ArrowRightLeft,
  transfer_approved: CheckCircle2,
  transfer_rejected: AlertTriangle,
  escalation_requested: ShieldAlert,
  escalation_resolved: ShieldAlert,
  extension_requested: CalendarClock,
  extension_approved: CalendarClock,
  extension_rejected: AlertTriangle,
  closure_approved: CheckCircle2,
  returned_for_rework: RotateCcw,
  compliance_resubmitted: FileText,
  clarification_requested: MessageSquare,
  clarification_replied: MessageSquare,
  task_assigned: ListTodo,
  task_assignee_completed: CheckCircle2,
  task_consolidation_required: ClipboardList,
  task_closed: CheckCircle2,
};

interface NotificationListProps {
  notifications: NotificationRecord[];
  compact?: boolean;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  showActions?: boolean;
}

export function NotificationList({
  notifications,
  compact = false,
  onMarkRead,
  onMarkAllRead,
  showActions = true,
}: NotificationListProps) {
  if (!notifications.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No notifications yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {showActions && onMarkAllRead && notifications.some((n) => !n.readAt) && (
        <div className="flex justify-end px-1 pb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onMarkAllRead}
          >
            Mark all read
          </Button>
        </div>
      )}
      <ul className={cn("space-y-1", compact ? "max-h-80 overflow-y-auto" : "")}>
        {notifications.map((notification) => {
          const Icon = typeIcons[notification.type] ?? Bell;
          const isUnread = !notification.readAt;
          const targetUserId =
            typeof notification.metadata?.target_user_id === "string"
              ? notification.metadata.target_user_id
              : null;
          const taskId =
            typeof notification.metadata?.taskId === "string"
              ? notification.metadata.taskId
              : null;
          const isUserNotification = notification.type.startsWith("user_") ||
            notification.type === "password_reset";
          const href = notification.dakId
            ? `/dashboard/dak/${notification.dakId}`
            : taskId
              ? `/dashboard/tasks/${taskId}`
              : targetUserId
                ? `/dashboard/admin/users/${targetUserId}`
                : isUserNotification
                  ? "/dashboard/admin/users"
                  : "/dashboard/notifications";

          return (
            <li key={notification.id}>
              <div
                className={cn(
                  "rounded-lg border px-3 py-2.5 transition-colors",
                  isUnread
                    ? "border-primary/20 bg-primary/[0.04]"
                    : "border-transparent bg-muted/20"
                )}
              >
                <div className="flex gap-2">
                  <div
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                      notification.type === "dak_overdue"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-medium">{notification.title}</p>
                      {isUnread && (
                        <span className="size-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {notification.body}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{formatDakDateTime(notification.createdAt)}</span>
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        {NOTIFICATION_TYPE_LABELS[notification.type]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={href}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {notification.dakNumber
                          ? `View ${notification.dakNumber}`
                          : "View details"}
                      </Link>
                      {isUnread && onMarkRead && (
                        <button
                          type="button"
                          onClick={() => onMarkRead(notification.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
