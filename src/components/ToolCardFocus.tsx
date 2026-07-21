"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight, Maximize2, X } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ToolCardExample } from "@/components/ToolCardExample";
import { ToolRatingSummary } from "@/components/ToolRatingSummary";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getCategoryAccentCssVar } from "@/lib/category-accent-colors";
import { renderTextWithLtrUnits } from "@/lib/text-direction";

type ToolCardFocusProps = {
  slug: string;
  href: string;
  label: string;
  description?: string;
  example?: string;
  icon: ReactNode;
  categoryId?: InventoryCategoryId;
  className?: string;
  /** Controlled open state — when set, parent owns the dialog. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the Maximize2 control (e.g. cover-only homepage cards). Default true. */
  showExpandButton?: boolean;
  /** Primary CTA label override (defaults to ToolCard.openTool). */
  openLabel?: string;
  /** When false, hide star ratings (guides / non-tool cards). Default true. */
  showRating?: boolean;
};

/**
 * Card Focus mode (ported from WattQuick): a Maximize2 button in the tool
 * card's top-right corner that zooms a 2x-scaled version of the card into a
 * centered overlay. Can also be opened programmatically via `open`/`onOpenChange`.
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
  open: openProp,
  onOpenChange,
  showExpandButton = true,
  openLabel,
  showRating = true,
}: ToolCardFocusProps) {
  const t = useTranslations("ToolCard");
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  const close = useCallback(() => setOpen(false), [setOpen]);

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
      {showExpandButton ? (
        <button
          type="button"
          className={clsx("tool-card-focus__expand", className)}
          aria-label={t("expandAria", { label })}
          aria-haspopup="dialog"
          title={t("focusMode")}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(true);
          }}
        >
          <Maximize2 className="tool-card-focus__expand-icon" strokeWidth={2} aria-hidden />
        </button>
      ) : null}

      {open
        ? createPortal(
            <div
              className="tool-card-focus"
              role="dialog"
              aria-modal="true"
              aria-label={t("focusDialogAria", { label })}
              style={
                categoryId
                  ? ({
                      "--category-accent": getCategoryAccentCssVar(categoryId),
                    } as CSSProperties)
                  : undefined
              }
              onClick={(event) => {
                event.stopPropagation();
                if (event.target === event.currentTarget) close();
              }}
            >
              <div className="tool-card-focus__card">
                <button
                  type="button"
                  className="tool-card-focus__close"
                  aria-label={t("closeFocus")}
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
                  <p className="tool-card-focus__meta">{renderTextWithLtrUnits(description)}</p>
                ) : null}

                {example ? <ToolCardExample example={example} defaultOpen /> : null}

                <div className="tool-card-focus__footer">
                  {showRating ? (
                    <ToolRatingSummary
                      toolId={slug}
                      categoryId={categoryId}
                      className="tool-card-focus__rating"
                    />
                  ) : (
                    <span />
                  )}
                  <Link href={href} className="tool-card-focus__open" prefetch={false}>
                    {openLabel ?? t("openTool")}
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
