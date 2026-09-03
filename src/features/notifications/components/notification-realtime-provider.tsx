"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions/notification-actions";
import { showNotificationToast } from "@/features/notifications/lib/notification-toast";
import {
  canViewAllNotifications,
  type NotificationRecord,
} from "@/features/notifications/lib/notification-models";
import { subscribeToNotificationInserts } from "@/lib/realtime/notification-channel";
import type { SessionUser } from "@/types";

export const DROPDOWN_NOTIFICATION_LIMIT = 10;

interface NotificationRealtimeContextValue {
  notifications: NotificationRecord[];
  dropdownNotifications: NotificationRecord[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  isPending: boolean;
  hydrateNotifications: (records: NotificationRecord[], unread: number) => void;
}

const NotificationRealtimeContext =
  createContext<NotificationRealtimeContextValue | null>(null);

function prependNotification(
  records: NotificationRecord[],
  incoming: NotificationRecord
): NotificationRecord[] {
  if (records.some((record) => record.id === incoming.id)) {
    return records;
  }
  return [incoming, ...records];
}

interface NotificationRealtimeProviderProps {
  user: SessionUser;
  initialNotifications: NotificationRecord[];
  initialUnreadCount: number;
  children: ReactNode;
}

export function NotificationRealtimeProvider({
  user,
  initialNotifications,
  initialUnreadCount,
  children,
}: NotificationRealtimeProviderProps) {
  const [notifications, setNotifications] =
    useState<NotificationRecord[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();
  const seenIdsRef = useRef(new Set(initialNotifications.map((n) => n.id)));

  const viewAll = canViewAllNotifications(user);

  const handleInsert = useCallback((incoming: NotificationRecord) => {
    if (seenIdsRef.current.has(incoming.id)) return;
    seenIdsRef.current.add(incoming.id);

    setNotifications((current) => prependNotification(current, incoming));
    if (!incoming.readAt) {
      setUnreadCount((count) => count + 1);
    }
    showNotificationToast(incoming);
  }, []);

  useEffect(() => {
    const { unsubscribe } = subscribeToNotificationInserts({
      userId: user.id,
      viewAll,
      onInsert: handleInsert,
    });

    return unsubscribe;
  }, [user.id, viewAll, handleInsert]);

  const markRead = useCallback((id: string) => {
    startTransition(async () => {
      let wasUnread = false;
      setNotifications((current) => {
        const target = current.find((record) => record.id === id);
        wasUnread = !!target && !target.readAt;
        return current.map((record) =>
          record.id === id
            ? { ...record, readAt: new Date().toISOString() }
            : record
        );
      });

      const result = await markNotificationReadAction(id);
      if (!result.success) return;

      if (wasUnread) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    });
  }, []);

  const markAllRead = useCallback(() => {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.success) return;

      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((record) => ({ ...record, readAt }))
      );
      setUnreadCount(0);
    });
  }, []);

  const hydrateNotifications = useCallback(
    (records: NotificationRecord[], unread: number) => {
      for (const record of records) {
        seenIdsRef.current.add(record.id);
      }
      setNotifications(records);
      setUnreadCount(unread);
    },
    []
  );

  const dropdownNotifications = useMemo(
    () => notifications.slice(0, DROPDOWN_NOTIFICATION_LIMIT),
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      dropdownNotifications,
      unreadCount,
      markRead,
      markAllRead,
      isPending,
      hydrateNotifications,
    }),
    [
      notifications,
      dropdownNotifications,
      unreadCount,
      markRead,
      markAllRead,
      isPending,
      hydrateNotifications,
    ]
  );

  return (
    <NotificationRealtimeContext.Provider value={value}>
      {children}
    </NotificationRealtimeContext.Provider>
  );
}

export function useNotifications(): NotificationRealtimeContextValue {
  const context = useContext(NotificationRealtimeContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationRealtimeProvider"
    );
  }
  return context;
}
