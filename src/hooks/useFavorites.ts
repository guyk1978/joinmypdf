"use client";

import { useCallback, useEffect, useState } from "react";

export const FAVORITES_STORAGE_KEY = "joinmypdf-tool-favorites";

export const FAVORITES_CHANGE_EVENT = "joinmypdf-favorites-change";

function readFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeFavoriteIds(ids: string[]) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGE_EVENT));
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavoriteIds(readFavoriteIds());
    setHydrated(true);

    const sync = () => setFavoriteIds(readFavoriteIds());
    window.addEventListener(FAVORITES_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  const toggleFavorite = useCallback((id: string) => {
    const current = readFavoriteIds();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    writeFavoriteIds(next);
    setFavoriteIds(next);
  }, []);

  const removeFavorite = useCallback((id: string) => {
    const next = readFavoriteIds().filter((item) => item !== id);
    writeFavoriteIds(next);
    setFavoriteIds(next);
  }, []);

  return { favoriteIds, isFavorite, toggleFavorite, removeFavorite, hydrated };
}
