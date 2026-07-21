"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RECENT_ACTIVITY_CHANGED_EVENT,
  MAX_RECENT_TOOLS,
  readRecentToolIds,
  recordRecentTool,
} from "@/lib/recent-activity";

/**
 * Tracks the last tools the visitor opened (chronological, newest first).
 * Backed by localStorage; syncs across tabs via the storage event and
 * within the same tab via RECENT_ACTIVITY_CHANGED_EVENT.
 */
export function useRecentTools(limit: number = MAX_RECENT_TOOLS) {
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setRecentToolIds(readRecentToolIds().slice(0, limit));
    sync();
    setHydrated(true);
    window.addEventListener(RECENT_ACTIVITY_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(RECENT_ACTIVITY_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [limit]);

  const trackTool = useCallback((toolId: string) => {
    if (!toolId) return;
    recordRecentTool(toolId);
    setRecentToolIds(readRecentToolIds().slice(0, limit));
  }, [limit]);

  return { recentToolIds, trackTool, hydrated };
}
