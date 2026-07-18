"use client";

import { useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share2, Star, X } from "lucide-react";
import { clsx } from "clsx";
import { createPortal } from "react-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { usePageShare } from "@/hooks/usePageShare";
import {
  getCategoryAccentCssVar,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import type { InventoryCategoryId } from "@/data/inventory-hubs";

export type ToolModalTab = "calc" | "doc" | "related";

export type ToolModalWrapperProps = {
  open: boolean;
  title: string;
  /** Short description included in Web Share payload. */
  description?: string;
  /** Tool id used for favorites toggle. */
  slug?: string;
  /** Inventory category for accent theming — resolved from slug when omitted. */
  categoryId?: InventoryCategoryId;
  onClose: () => void;
  onExitComplete?: () => void;
  /** CALC tab — tool UI (iframe, calculator, workspace). */
  calc: ReactNode;
  /** DOC tab — documentation / formulas / explanation. */
  docs?: ReactNode;
  /** RELATED tab — similar tools + articles. */
  related?: ReactNode;
  defaultTab?: ToolModalTab;
  /** True once the CALC surface (e.g. iframe) has finished mounting. */
  contentReady?: boolean;
  labels?: {
    calc?: string;
    doc?: string;
    related?: string;
    close?: string;
    loading?: string;
    addFavorite?: string;
    removeFavorite?: string;
  };
  className?: string;
};

/**
 * Global JoinMyPDF tool modal shell (Industrial Matte).
 * Isolated portal overlay — does not render site header/footer inside itself.
 */
export function ToolModalWrapper({
  open,
  title,
  description,
  slug,
  categoryId: categoryIdProp,
  onClose,
  onExitComplete,
  calc,
  docs,
  related,
  defaultTab = "calc",
  contentReady = true,
  labels,
  className,
}: ToolModalWrapperProps) {
  const titleId = useId();
  const [tab, setTab] = useState<ToolModalTab>(defaultTab);
  const [mounted, setMounted] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = slug ? isFavorite(slug) : false;
  const sharePayload = useMemo(
    () => ({
      title,
      text: description?.trim() || undefined,
    }),
    [description, title],
  );
  const { handleShare, copied, busy: shareBusy, ariaLabel: shareAriaLabel, linkCopiedLabel } =
    usePageShare(sharePayload);
  const categoryId = categoryIdProp ?? resolveToolCategoryId(slug);
  const accentStyle = categoryId
    ? ({ "--category-accent": getCategoryAccentCssVar(categoryId) } as CSSProperties)
    : undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTab(defaultTab);
  }, [open, defaultTab, title]);

  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    const prevBodyPad = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbar > 0) {
      document.body.style.paddingRight = `${scrollbar}px`;
    }
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      document.body.style.paddingRight = prevBodyPad;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const calcLabel = labels?.calc ?? "CALC";
  const docLabel = labels?.doc ?? "DOC";
  const relatedLabel = labels?.related ?? "RELATED";
  const closeLabel = labels?.close ?? "Close";
  const loadingLabel = labels?.loading ?? "Loading tool…";
  const favoriteLabel = favorited
    ? (labels?.removeFavorite ?? "Remove from favorites")
    : (labels?.addFavorite ?? "Add to favorites");

  const panes: { id: ToolModalTab; content: ReactNode; scroll?: boolean }[] = [
    { id: "calc", content: calc },
    ...(docs != null ? [{ id: "doc" as const, content: docs, scroll: true }] : []),
    ...(related != null
      ? [{ id: "related" as const, content: related, scroll: true }]
      : []),
  ];

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {open ? (
        <div
          className={clsx(
            "tool-modal",
            !contentReady && "tool-modal--loading",
            className,
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-busy={!contentReady}
        >
          {/* Opaque veil first — masks any background page paint / flicker */}
          <motion.button
            type="button"
            className="tool-modal__backdrop"
            aria-label={closeLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
          />

          <motion.div
            className="tool-modal__panel"
            data-category={categoryId || undefined}
            style={accentStyle}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
          >
            <header className="tool-modal__header">
              <h2 id={titleId} className="tool-modal__title">
                {title}
              </h2>

              <div className="tool-modal__header-end">
                <nav className="tool-modal__tabs" aria-label="Tool views">
                  {panes.map(({ id }) => {
                    const label =
                      id === "calc" ? calcLabel : id === "doc" ? docLabel : relatedLabel;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={clsx(
                          "tool-modal__tab",
                          tab === id && "tool-modal__tab--active",
                        )}
                        aria-pressed={tab === id}
                        onClick={() => setTab(id)}
                      >
                        [{label}]
                      </button>
                    );
                  })}
                </nav>

                <button
                  type="button"
                  className="tool-modal__action"
                  onClick={() => {
                    void handleShare();
                  }}
                  disabled={shareBusy}
                  aria-label={shareAriaLabel}
                >
                  <Share2 size={18} strokeWidth={2} aria-hidden />
                </button>

                {slug ? (
                  <button
                    type="button"
                    className={clsx(
                      "tool-modal__action",
                      favorited && "tool-modal__action--favorite",
                    )}
                    onClick={() => toggleFavorite(slug)}
                    aria-label={favoriteLabel}
                    aria-pressed={favorited}
                  >
                    <Star
                      size={18}
                      strokeWidth={2}
                      className={clsx(favorited && "fill-current")}
                      aria-hidden
                    />
                  </button>
                ) : null}

                <button
                  type="button"
                  className="tool-modal__action tool-modal__close"
                  onClick={onClose}
                  aria-label={closeLabel}
                >
                  <X size={18} strokeWidth={2.25} aria-hidden />
                </button>
              </div>
            </header>

            <div className="tool-modal__body">
              {tab === "calc" && !contentReady ? (
                <div className="tool-modal__boot" aria-live="polite">
                  <span className="tool-modal__calc-spinner" aria-hidden />
                  <span>{loadingLabel}</span>
                </div>
              ) : null}

              {panes.map(({ id, content, scroll }) => (
                <div
                  key={id}
                  className={clsx(
                    "tool-modal__pane",
                    scroll && "tool-modal__pane--scroll",
                    tab === id && "tool-modal__pane--active",
                    id === "calc" && !contentReady && "tool-modal__pane--pending",
                  )}
                  aria-hidden={tab !== id}
                >
                  {content}
                </div>
              ))}
            </div>

            {copied ? (
              <div className="tool-modal__toast" role="status" aria-live="polite">
                {linkCopiedLabel}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
