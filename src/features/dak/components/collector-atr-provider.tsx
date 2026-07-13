"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  countUnreadAtrDaks,
  getViewedAtrDakIds,
  markAtrDakViewed,
} from "@/features/dak/lib/collector-atr-viewed";

interface CollectorAtrContextValue {
  pendingDakIds: string[];
  unreadCount: number;
  isViewed: (dakId: string) => boolean;
  markViewed: (dakId: string) => void;
}

const CollectorAtrContext = createContext<CollectorAtrContextValue | null>(null);

interface CollectorAtrProviderProps {
  userId: string;
  pendingDakIds: string[];
  children: React.ReactNode;
}

export function CollectorAtrProvider({
  userId,
  pendingDakIds,
  children,
}: CollectorAtrProviderProps) {
  const [viewedIds, setViewedIds] = useState<string[]>(() =>
    getViewedAtrDakIds(userId)
  );

  const unreadCount = useMemo(
    () => countUnreadAtrDaks(userId, pendingDakIds),
    [userId, pendingDakIds, viewedIds]
  );

  const isViewed = useCallback(
    (dakId: string) => viewedIds.includes(dakId),
    [viewedIds]
  );

  const markViewed = useCallback(
    (dakId: string) => {
      markAtrDakViewed(userId, dakId);
      setViewedIds((current) =>
        current.includes(dakId) ? current : [...current, dakId]
      );
    },
    [userId]
  );

  const value = useMemo(
    () => ({
      pendingDakIds,
      unreadCount,
      isViewed,
      markViewed,
    }),
    [pendingDakIds, unreadCount, isViewed, markViewed]
  );

  return (
    <CollectorAtrContext.Provider value={value}>
      {children}
    </CollectorAtrContext.Provider>
  );
}

export function useCollectorAtr(): CollectorAtrContextValue | null {
  return useContext(CollectorAtrContext);
}
