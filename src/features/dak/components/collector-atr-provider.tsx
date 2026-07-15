"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

/**
 * Viewed ATR IDs live in localStorage — load them only after mount so
 * server HTML and the first client render stay identical (avoids hydration mismatch).
 */
export function CollectorAtrProvider({
  userId,
  pendingDakIds,
  children,
}: CollectorAtrProviderProps) {
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setViewedIds(getViewedAtrDakIds(userId));
    setHydrated(true);
  }, [userId]);

  const unreadCount = useMemo(() => {
    if (!hydrated) {
      // Match SSR: treat nothing as viewed until localStorage is applied
      return pendingDakIds.length;
    }
    return countUnreadAtrDaks(userId, pendingDakIds);
  }, [userId, pendingDakIds, viewedIds, hydrated]);

  const isViewed = useCallback(
    (dakId: string) => (hydrated ? viewedIds.includes(dakId) : false),
    [viewedIds, hydrated]
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
