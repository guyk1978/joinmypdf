"use client";

import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";

export type ToolPageViewTab = "calc" | "doc" | "related" | "reviews";

type ToolPageViewShellProps = {
  calc: ReactNode;
  doc?: ReactNode;
  related?: ReactNode;
  reviews?: ReactNode;
  defaultTab?: ToolPageViewTab;
  className?: string;
  /** Accessible name for the tab list. */
  tabsLabel?: string;
};

/**
 * Instant CALC / DOC / RELATED / REVIEWS view switcher for full tool pages.
 * Content stays mounted (SEO-friendly); inactive panes are visually hidden.
 */
export function ToolPageViewShell({
  calc,
  doc,
  related,
  reviews,
  defaultTab = "calc",
  className,
  tabsLabel,
}: ToolPageViewShellProps) {
  const t = useTranslations("ToolModal");
  const [tab, setTab] = useState<ToolPageViewTab>(defaultTab);

  const labels: Record<ToolPageViewTab, string> = {
    calc: t.has("calc") ? t("calc") : "CALC",
    doc: t.has("doc") ? t("doc") : "DOC",
    related: t.has("related") ? t("related") : "RELATED",
    reviews: t.has("reviews") ? t("reviews") : "REVIEWS",
  };

  const panes: { id: ToolPageViewTab; content: ReactNode }[] = [
    { id: "calc", content: calc },
    ...(doc != null ? [{ id: "doc" as const, content: doc }] : []),
    ...(related != null ? [{ id: "related" as const, content: related }] : []),
    ...(reviews != null ? [{ id: "reviews" as const, content: reviews }] : []),
  ];

  return (
    <div
      className={clsx("tool-page-view flex min-h-0 w-full flex-1 flex-col", className)}
      data-active-tab={tab}
    >
      <nav className="tool-page-view__tabs" aria-label={tabsLabel ?? "Tool views"}>
        {panes.map(({ id }) => (
          <button
            key={id}
            type="button"
            className={clsx(
              "tool-page-view__tab",
              tab === id && "tool-page-view__tab--active",
            )}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {labels[id]}
          </button>
        ))}
      </nav>

      <div className="tool-page-view__body flex min-h-0 w-full flex-1 flex-col">
        {panes.map(({ id, content }) => (
          <div
            key={id}
            className={clsx(
              "tool-page-view__pane min-h-0 w-full",
              id === "calc" && "tool-page-view__pane--calc flex flex-1 flex-col",
              id !== "calc" && "tool-page-view__pane--scroll",
              tab === id && "tool-page-view__pane--active",
            )}
            aria-hidden={tab !== id}
            {...(tab !== id ? ({ inert: true } as { inert: boolean }) : {})}
          >
            {content}
          </div>
        ))}
      </div>
    </div>
  );
}
