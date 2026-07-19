"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { LayoutGrid, X } from "lucide-react";
import { CategoryHubsSection } from "@/components/CategoryHubsSection";

/**
 * Header "Tools" button + full-screen Category Hub overlay.
 * Opens a centered, fade-in grid of all category hubs (the same
 * CategoryHubsSection used on the homepage). Closes on Escape, backdrop
 * click, the X button, or when a category link is clicked.
 */
export function HeaderCategoryHub() {
  const tHeader = useTranslations("Header");
  const tHome = useTranslations("Home");
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        className="site-header__nav-link site-header__tools-hub"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <LayoutGrid className="site-header__nav-icon" aria-hidden size={16} strokeWidth={1.75} />
        <span className="site-header__tools-hub-label">{tHeader("toolsHub")}</span>
      </button>

      {open
        ? createPortal(
            <div
              className="category-hub-overlay"
              role="dialog"
              aria-modal="true"
              aria-label={tHome("landing.categoriesTitle")}
              onClick={(event) => {
                if (event.target === event.currentTarget) close();
              }}
            >
              <button
                type="button"
                className="category-hub-overlay__close"
                aria-label={tHeader("allTools.close")}
                onClick={close}
                autoFocus
              >
                <X className="category-hub-overlay__close-icon" strokeWidth={2} aria-hidden />
              </button>

              <div
                className="category-hub-overlay__panel"
                onClick={(event) => {
                  // Close as soon as a category link is activated so the
                  // overlay doesn't linger over the page transition.
                  const target = event.target as HTMLElement;
                  if (target.closest("a")) close();
                }}
              >
                <p className="category-hub-overlay__eyebrow">
                  {tHome("landing.categoriesEyebrow")}
                </p>
                <h2 className="category-hub-overlay__title">
                  {tHome("landing.categoriesTitle")}
                </h2>
                <CategoryHubsSection
                  className="category-hub-overlay__grid"
                  hideHead
                  dense
                  navLabel={tHome("landing.heroCategoriesLabel")}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
