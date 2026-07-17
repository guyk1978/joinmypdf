"use client";

import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";

export type ToolPageViewTab = "calc" | "doc" | "related";

type ToolPageViewShellProps = {
  calc: ReactNode;
  doc?: ReactNode;
  related?: ReactNode;
  defaultTab?: ToolPageViewTab;
  className?: string;
  /** Accessible name for the tab list. */
  tabsLabel?: string;
};

/**
 * Instant CALC / DOC / RELATED view switcher for full tool pages.
 * Content stays mounted (SEO-friendly); inactive panes are visually hidden.
 */
export function ToolPageViewShell({
  calc,
  doc,
  related,
  defaultTab = "calc",
  className,
  tabsLabel,
}: ToolPageViewShellProps) {
  const t = useTranslations("ToolModal");
  const [tab, setTab] = useState<ToolPageViewTab>(defaultTab);

  const calcLabel = t.has("calc") ? t("calc") : "CALC";
  const docLabel = t.has("doc") ? t("doc") : "DOC";
  const relatedLabel = t.has("related") ? t("related") : "RELATED";

  const panes: { id: ToolPageViewTab; content: ReactNode }[] = [
    { id: "calc", content: calc },
    ...(doc != null ? [{ id: "doc" as const, content: doc }] : []),
    ...(related != null ? [{ id: "related" as const, content: related }] : []),
  ];

  return (
    <div className={clsx("tool-page-view", className)} data-active-tab={tab}>
      <nav className="tool-page-view__tabs" aria-label={tabsLabel ?? "Tool views"}>
        {panes.map(({ id }) => {
          const label =
            id === "calc" ? calcLabel : id === "doc" ? docLabel : relatedLabel;
          return (
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
              [{label}]
            </button>
          );
        })}
      </nav>

      <div className="tool-page-view__body">
        {panes.map(({ id, content }) => (
          <div
            key={id}
            className={clsx(
              "tool-page-view__pane",
              id === "calc" && "tool-page-view__pane--calc",
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
