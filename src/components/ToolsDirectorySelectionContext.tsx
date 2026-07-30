"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToolsDirectorySelectionContextValue = {
  selectedIds: ReadonlySet<string>;
  selectedCount: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
  remove: (ids: readonly string[]) => void;
  getSelectedIds: () => string[];
};

const ToolsDirectorySelectionContext =
  createContext<ToolsDirectorySelectionContextValue | null>(null);

export function ToolsDirectorySelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggle = useCallback((id: string) => {
    if (!id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const remove = useCallback((ids: readonly string[]) => {
    if (!ids.length) return;
    setSelectedIds((prev) => {
      if (!prev.size) return prev;
      const next = new Set(prev);
      let changed = false;
      for (const id of ids) {
        if (next.delete(id)) changed = true;
      }
      return changed ? next : prev;
    });
  }, []);

  const getSelectedIds = useCallback(() => Array.from(selectedIds), [selectedIds]);

  const value = useMemo(
    () => ({
      selectedIds,
      selectedCount: selectedIds.size,
      isSelected,
      toggle,
      clear,
      remove,
      getSelectedIds,
    }),
    [selectedIds, isSelected, toggle, clear, remove, getSelectedIds],
  );

  return (
    <ToolsDirectorySelectionContext.Provider value={value}>
      {children}
    </ToolsDirectorySelectionContext.Provider>
  );
}

export function useToolsDirectorySelection() {
  return useContext(ToolsDirectorySelectionContext);
}
