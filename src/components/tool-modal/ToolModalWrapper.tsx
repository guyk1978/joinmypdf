"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { createPortal } from "react-dom";

export type ToolModalTab = "calc" | "doc" | "related";

export type ToolModalWrapperProps = {
  open: boolean;
  title: string;
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
                  className="tool-modal__close"
                  onClick={onClose}
                  aria-label={closeLabel}
                >
                  <X size={20} strokeWidth={2.25} aria-hidden />
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
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
