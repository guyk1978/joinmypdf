"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight, Maximize2, X } from "lucide-react";
import { clsx } from "clsx";
import { Link } from "@/i18n/navigation";
import { ToolCardExample } from "@/components/ToolCardExample";
import { ToolRatingSummary } from "@/components/ToolRatingSummary";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getCategoryAccentCssVar } from "@/lib/category-accent-colors";

type ToolCardFocusProps = {
  slug: string;
  href: string;
  label: string;
  description?: string;
  example?: string;
  icon: ReactNode;
  categoryId?: InventoryCategoryId;
  className?: string;
};

/**
 * Card Focus mode (ported from WattQuick): a Maximize2 button in the tool
 * card's top-right corner that zooms a 2x-scaled version of the card into a
 * centered overlay. The scaled copy is re-rendered with doubled rem sizes —
 * not `transform: scale(2)` — so text stays crisp. The Example box opens
 * automatically in focus mode, and the star rating is fully interactive.
 */
export function ToolCardFocus({
  slug,
  href,
  label,
  description,
  example,
  icon,
  categoryId,
  className,
}: ToolCardFocusProps) {
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
        className={clsx("tool-card-focus__expand", className)}
        aria-label={`Expand ${label}`}
        aria-haspopup="dialog"
        title="Focus mode"
        onClick={(event) => {
          // Cards are links (or hold an overlay link); never let expand navigate.
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <Maximize2 className="tool-card-focus__expand-icon" strokeWidth={2} aria-hidden />
      </button>

      {open
        ? createPortal(
            <div
              className="tool-card-focus"
              role="dialog"
              aria-modal="true"
              aria-label={`${label} — focus mode`}
              style={
                categoryId
                  ? ({
                      "--category-accent": getCategoryAccentCssVar(categoryId),
                    } as CSSProperties)
                  : undefined
              }
              onClick={(event) => {
                // Portal events bubble through the React tree into the card
                // link — contain them here, then treat backdrop clicks as close.
                event.stopPropagation();
                if (event.target === event.currentTarget) close();
              }}
            >
              <div className="tool-card-focus__card">
                <button
                  type="button"
                  className="tool-card-focus__close"
                  aria-label="Close focus mode"
                  onClick={close}
                  autoFocus
                >
                  <X className="tool-card-focus__close-icon" strokeWidth={2} aria-hidden />
                </button>

                <span className="tool-card-focus__icon" aria-hidden>
                  {icon}
                </span>

                <h2 className="tool-card-focus__title">{label}</h2>
                {description ? (
                  <p className="tool-card-focus__meta">{description}</p>
                ) : null}

                {example ? <ToolCardExample example={example} defaultOpen /> : null}

                <div className="tool-card-focus__footer">
                  <ToolRatingSummary
                    toolId={slug}
                    categoryId={categoryId}
                    className="tool-card-focus__rating"
                  />
                  <Link href={href} className="tool-card-focus__open" prefetch={false}>
                    Open tool
                    <ArrowUpRight
                      className="tool-card-focus__open-icon"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
