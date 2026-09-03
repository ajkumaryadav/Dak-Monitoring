import type { NotificationRecord } from "@/features/notifications/lib/notification-models";

export interface NotificationChannelOptions {
  userId: string;
  /** Collector, ACP, ADM — subscribe to all district INSERT events. */
  viewAll?: boolean;
  onInsert: (notification: NotificationRecord) => void;
}

export interface NotificationChannelHandle {
  unsubscribe: () => void;
}

/**
 * Polls for live notification updates periodically in the background
 * without external websocket or cloud dependencies.
 */
export function subscribeToNotificationInserts(
  options: NotificationChannelOptions
): NotificationChannelHandle {
  let timer: NodeJS.Timeout | null = null;
  let disposed = false;
  let lastCheckedTime = new Date().toISOString();

  const poll = async () => {
    if (disposed) return;

    try {
      const res = await fetch(
        `/api/notifications/poll?userId=${encodeURIComponent(options.userId)}&since=${encodeURIComponent(lastCheckedTime)}&viewAll=${options.viewAll ? "1" : "0"}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.notifications && Array.isArray(data.notifications)) {
          for (const notification of data.notifications) {
            options.onInsert(notification);
          }
        }
        if (data.timestamp) {
          lastCheckedTime = data.timestamp;
        }
      }
    } catch {
      // Ignore background network polling errors
    }
  };

  // Poll every 15 seconds
  timer = setInterval(() => {
    void poll();
  }, 15000);

  return {
    unsubscribe: () => {
      disposed = true;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
  };
}
