"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { InventoryCategoryId } from "@/data/inventory-hubs";

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

export type ToolModalContextValue = {
  openToolModal: (options: OpenToolModalOptions) => void;
  closeToolModal: (options?: { href?: string }) => void;
  isOpen: boolean;
};

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
