"use client";

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

type ArticleModalProps = {
  title: string;
  children: ReactNode;
  closeLabel?: string;
  className?: string;
  /** Called when the user dismisses the modal (X, backdrop, Escape). */
  onClose: () => void;
};

/**
 * Blog article modal shell — reuses Industrial Matte tool-modal chrome.
 * Body overflow is locked without resetting scrollTop so the blog index
 * underneath keeps its scroll position.
 */
export function ArticleModal({
  title,
  children,
  closeLabel = "Close",
  className,
  onClose,
}: ArticleModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence
      onExitComplete={() => {
        onClose();
      }}
    >
      {open ? (
        <div
          className={clsx("tool-modal article-modal", className)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.button
            type="button"
            className="tool-modal__backdrop"
            aria-label={closeLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={handleClose}
          />

          <motion.div
            className="tool-modal__panel article-modal__panel"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
          >
            <header className="tool-modal__header article-modal__header">
              <h2 id={titleId} className="tool-modal__title">
                {title}
              </h2>
              <div className="tool-modal__header-end">
                <button
                  type="button"
                  className="tool-modal__action tool-modal__close article-modal__close"
                  onClick={handleClose}
                  aria-label={closeLabel}
                >
                  <X size={18} strokeWidth={2.25} aria-hidden />
                </button>
              </div>
            </header>

            <div className="tool-modal__body">
              <div className="tool-modal__pane tool-modal__pane--scroll tool-modal__pane--active article-modal__pane">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
