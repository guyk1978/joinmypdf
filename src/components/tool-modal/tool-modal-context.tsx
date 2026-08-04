"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import type {
  ToolModalSessionValue,
  ToolModalTab,
} from "@/components/tool-modal/tool-modal-session-context";

export type OpenToolModalOptions = {
  slug: string;
  href: string;
  title: string;
  description?: string;
  /** Parent category that opened this tool — drives accent theming. */
  categoryId?: InventoryCategoryId;
  /** Category hub (or other) URL to restore when closing. */
  returnHref?: string;
  calc?: ReactNode;
  docs?: ReactNode;
  related?: ReactNode;
  skipUrlSync?: boolean;
};

/** Stable action bridge — always points at the live ToolModalWrapper handlers. */
export type ToolModalActions = {
  setTab: (tab: ToolModalTab) => void;
  saveProject: () => void;
  share: () => void;
  toggleFavorite: () => void;
  close: () => void;
};

export type ToolModalContextValue = {
  openToolModal: (options: OpenToolModalOptions) => void;
  closeToolModal: (options?: { href?: string }) => void;
  isOpen: boolean;
  /** Live chrome state while a tool modal session is mounted. */
  session: ToolModalSessionValue | null;
  registerSession: (session: ToolModalSessionValue | null) => void;
  /** Call these from header menus — never stale closures. */
  actions: ToolModalActions;
};

const noopActions: ToolModalActions = {
  setTab: () => {},
  saveProject: () => {},
  share: () => {},
  toggleFavorite: () => {},
  close: () => {},
};

export const EMPTY_TOOL_MODAL_ACTIONS = noopActions;

export const ToolModalContext = createContext<ToolModalContextValue | null>(null);

export function useToolModal(): ToolModalContextValue {
  const ctx = useContext(ToolModalContext);
  if (!ctx) {
    throw new Error("useToolModal must be used within ToolModalProvider");
  }
  return ctx;
}

export function useOptionalToolModal(): ToolModalContextValue | null {
  return useContext(ToolModalContext);
}
