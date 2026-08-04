"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ToolModalTab = "calc" | "doc" | "related" | "reviews";

export type ToolModalSessionValue = {
  open: boolean;
  slug?: string;
  tab: ToolModalTab;
  setTab: (tab: ToolModalTab) => void;
  availableTabs: ToolModalTab[];
  tabLabels: Partial<Record<ToolModalTab, string>>;
  canSaveProject: boolean;
  saveProject: () => void;
  saveProjectLabel: string;
  share: () => void;
  shareBusy: boolean;
  shareLabel: string;
  favorited: boolean;
  toggleFavorite: () => void;
  favoriteLabel: string;
  close: () => void;
  closeLabel: string;
};

const ToolModalSessionContext = createContext<ToolModalSessionValue | null>(null);

export function ToolModalSessionProvider({
  value,
  children,
}: {
  value: ToolModalSessionValue | null;
  children: ReactNode;
}) {
  return (
    <ToolModalSessionContext.Provider value={value}>
      {children}
    </ToolModalSessionContext.Provider>
  );
}

export function useOptionalToolModalSession(): ToolModalSessionValue | null {
  return useContext(ToolModalSessionContext);
}
