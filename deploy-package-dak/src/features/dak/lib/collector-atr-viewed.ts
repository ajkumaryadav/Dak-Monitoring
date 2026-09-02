const STORAGE_PREFIX = "dak-collector-atr-viewed";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

/** Read DAK IDs the collector has already opened from ATR / Compliance queue. */
export function getViewedAtrDakIds(userId: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

/** Persist that the collector opened an ATR / Compliance DAK. */
export function markAtrDakViewed(userId: string, dakId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const viewed = new Set(getViewedAtrDakIds(userId));
  viewed.add(dakId);

  try {
    window.localStorage.setItem(
      storageKey(userId),
      JSON.stringify([...viewed])
    );
  } catch {
    // Ignore quota / privacy errors.
  }
}

/** Count DAKs not yet opened by the collector. */
export function countUnreadAtrDaks(
  userId: string,
  pendingDakIds: string[]
): number {
  const viewed = new Set(getViewedAtrDakIds(userId));
  return pendingDakIds.filter((id) => !viewed.has(id)).length;
}
