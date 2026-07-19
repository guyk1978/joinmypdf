"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getToolRatingAggregate,
  mergeUserVoteIntoAggregate,
  readUserToolRating,
  setUserToolRating,
  TOOL_RATINGS_CHANGED_EVENT,
  TOOL_RATINGS_STORAGE_KEY,
  type ToolRatingStats,
} from "@/lib/tool-rating";

/**
 * Hydrates the seeded catalog score for `toolId` and merges any once-only
 * localStorage vote. Ratings are keyed by the canonical tool slug so votes
 * never leak across similarly named tools.
 */
export function useToolRating(toolId: string | undefined) {
  const [userRating, setUserRatingState] = useState<number | null>(null);
  const [stats, setStats] = useState<ToolRatingStats>({
    sum: 0,
    count: 0,
    average: null,
  });
  const [hydrated, setHydrated] = useState(false);

  const recompute = useCallback(() => {
    if (!toolId) {
      setUserRatingState(null);
      setStats({ sum: 0, count: 0, average: null });
      return;
    }
    const remote = getToolRatingAggregate(toolId);
    const vote = readUserToolRating(toolId);
    setUserRatingState(vote);
    setStats(mergeUserVoteIntoAggregate(remote, vote));
  }, [toolId]);

  useEffect(() => {
    recompute();
    setHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === TOOL_RATINGS_STORAGE_KEY) recompute();
    };
    const onChanged = () => recompute();

    window.addEventListener("storage", onStorage);
    window.addEventListener(TOOL_RATINGS_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(TOOL_RATINGS_CHANGED_EVENT, onChanged);
    };
  }, [recompute]);

  const rate = useCallback(
    (rating: number) => {
      if (!toolId) return;
      setUserToolRating(toolId, rating);
      recompute();
    },
    [toolId, recompute],
  );

  return { userRating, stats, hydrated, rate };
}
