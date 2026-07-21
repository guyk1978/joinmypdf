"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const PINNED_TOOLS_STORAGE_KEY = "joinmypdf-pinned-tools";

export const PINNED_TOOLS_CHANGE_EVENT = "joinmypdf-pinned-tools-change";

export function readPinnedToolIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PINNED_TOOLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writePinnedToolIds(ids: string[]) {
  localStorage.setItem(PINNED_TOOLS_STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(PINNED_TOOLS_CHANGE_EVENT));
}

export function filterUnpinnedIds(ids: string[], pinnedIds: string[]): string[] {
  if (!pinnedIds.length) return ids;
  const pinnedSet = new Set(pinnedIds);
  return ids.filter((id) => !pinnedSet.has(id));
}

export function filterUnpinnedGridItems<T extends { slugHint: string }>(
  items: T[],
  pinnedIds: string[],
): T[] {
  if (!pinnedIds.length) return items;
  const pinnedSet = new Set(pinnedIds);
  return items.filter((item) => !pinnedSet.has(item.slugHint));
}

export function usePinnedTools() {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPinnedIds(readPinnedToolIds());
    setHydrated(true);

    const sync = () => setPinnedIds(readPinnedToolIds());
    window.addEventListener(PINNED_TOOLS_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PINNED_TOOLS_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isPinned = useCallback((id: string) => pinnedIds.includes(id), [pinnedIds]);

  const pinTool = useCallback((id: string) => {
    const current = readPinnedToolIds();
    if (current.includes(id)) return;
    const next = [...current, id];
    writePinnedToolIds(next);
    setPinnedIds(next);
  }, []);

  const unpinTool = useCallback((id: string) => {
    const next = readPinnedToolIds().filter((item) => item !== id);
    writePinnedToolIds(next);
    setPinnedIds(next);
  }, []);

  const togglePin = useCallback((id: string) => {
    const current = readPinnedToolIds();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    writePinnedToolIds(next);
    setPinnedIds(next);
    return !current.includes(id);
  }, []);

  return { pinnedIds, isPinned, pinTool, unpinTool, togglePin, hydrated };
}

/** Filter a list of tool ids once pinned state has hydrated. */
export function useUnpinnedIds(ids: string[]): string[] {
  const { pinnedIds, hydrated } = usePinnedTools();
  return useMemo(() => {
    if (!hydrated) return ids;
    return filterUnpinnedIds(ids, pinnedIds);
  }, [ids, pinnedIds, hydrated]);
}
