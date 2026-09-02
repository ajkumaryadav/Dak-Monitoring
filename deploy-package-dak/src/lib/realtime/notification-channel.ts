import type {
  AuthChangeEvent,
  RealtimeChannel,
  RealtimePostgresInsertPayload,
  Session,
} from "@supabase/supabase-js";

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
  channel: RealtimeChannel | null;
  unsubscribe: () => void;
}

let channelErrorLogged = false;

/**
 * Subscribe to live notification INSERT events via Supabase Realtime.
 * Waits for an authenticated browser session before subscribing.
 */
export function subscribeToNotificationInserts(
  options: NotificationChannelOptions
): NotificationChannelHandle {
  const supabase = createClient();
  const scope = options.viewAll ? "district" : "own";
  const channelName = `${NOTIFICATIONS_REALTIME_CHANNEL}:${options.userId}:${scope}`;

  let activeChannel: RealtimeChannel | null = null;
  let disposed = false;

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

  const attachChannel = () => {
    if (disposed || activeChannel) return;

    activeChannel = supabase
      .channel(channelName)
      .on("postgres_changes", changeConfig, (payload: RealtimePostgresInsertPayload<{ [key: string]: unknown }>) => {
        const row = payload.new as Record<string, unknown> | null;
        if (!row?.id) return;

        options.onInsert(mapNotificationRow(row));
      })
      .subscribe((status: string, err?: Error) => {
        if (status === "SUBSCRIBED") {
          channelErrorLogged = false;
          return;
        }

        if (status === "CHANNEL_ERROR" && !channelErrorLogged) {
          channelErrorLogged = true;
          console.warn(
            "[subscribeToNotificationInserts] Realtime channel unavailable — live notification toasts disabled. " +
              "Run supabase/migrations/000023_notifications_realtime.sql (or 000037_notifications_realtime_repair.sql) in the Supabase SQL Editor.",
            err?.message ?? ""
          );
        }
      });
  };

  const start = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (disposed || !session) return;
    attachChannel();
  };

  void start();

  const {
    data: { subscription: authSubscription },
  } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    if (disposed) return;

    if (session) {
      attachChannel();
      return;
    }

    if (activeChannel) {
      void supabase.removeChannel(activeChannel);
      activeChannel = null;
    }
  });

  return {
    get channel() {
      return activeChannel;
    },
    unsubscribe: () => {
      disposed = true;
      authSubscription.unsubscribe();
      if (activeChannel) {
        void supabase.removeChannel(activeChannel);
        activeChannel = null;
      }
    },
  };
}
