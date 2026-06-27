import type { RealtimeChannel } from "@supabase/supabase-js";

import { NOTIFICATIONS_REALTIME_CHANNEL } from "@/features/notifications/lib/notification-types";
import {
  mapNotificationRow,
  type NotificationRecord,
} from "@/features/notifications/services/notifications";
import { createClient } from "@/lib/supabase/client";

export interface NotificationChannelOptions {
  userId: string;
  /** Collector, ACP, ADM — subscribe to all district INSERT events. */
  viewAll?: boolean;
  onInsert: (notification: NotificationRecord) => void;
}

export interface NotificationChannelHandle {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

/**
 * Subscribe to live notification INSERT events via Supabase Realtime.
 * Cleans up with unsubscribe() — call on component unmount.
 */
export function subscribeToNotificationInserts(
  options: NotificationChannelOptions
): NotificationChannelHandle {
  const supabase = createClient();
  const scope = options.viewAll ? "district" : "own";
  const channelName = `${NOTIFICATIONS_REALTIME_CHANNEL}:${options.userId}:${scope}`;

  const changeConfig: {
    event: "INSERT";
    schema: "public";
    table: "notifications";
    filter?: string;
  } = {
    event: "INSERT",
    schema: "public",
    table: "notifications",
  };

  if (!options.viewAll) {
    changeConfig.filter = `user_id=eq.${options.userId}`;
  }

  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", changeConfig, (payload) => {
      const row = payload.new as Record<string, unknown> | null;
      if (!row?.id) return;

      options.onInsert(mapNotificationRow(row));
    })
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error("[subscribeToNotificationInserts] channel error");
      }
    });

  return {
    channel,
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}
