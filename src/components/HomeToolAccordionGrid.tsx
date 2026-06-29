"use client";

import { Fragment, useId, useState } from "react";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { getToolIcon, TOOL_ICON_BARE_CLASS } from "@/lib/tool-icons";
import type { HomeGridToolItem } from "@/lib/featured-tools";
import { chunkToolGridRows } from "@/lib/tool-grid";

const GRID_COLUMNS = 3;

type HomeToolAccordionGridProps = {
  items: HomeGridToolItem[];
};

export function HomeToolAccordionGrid({ items }: HomeToolAccordionGridProps) {
  const t = useTranslations("Home");
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const baseId = useId();

  const selectedIndex = selectedToolId
    ? items.findIndex((item) => item.slugHint === selectedToolId)
    : -1;
  const selectedRow = selectedIndex >= 0 ? Math.floor(selectedIndex / GRID_COLUMNS) : -1;
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null;
  const rows = chunkToolGridRows(items, GRID_COLUMNS);

  const onCardClick = (slug: string) => {
    setSelectedToolId((current) => (current === slug ? null : slug));
  };

  return (
    <div className="home-tool-accordion-grid">
      {rows.map((row, rowIndex) => {
        const isRowOpen = selectedRow === rowIndex && Boolean(selectedItem);
        const panelId = `${baseId}-panel-row-${rowIndex}`;

        return (
          <Fragment key={rowIndex}>
            <div className="home-tool-accordion-grid__row" role="list">
              {row.map((item) => {
                const isSelected = selectedToolId === item.slugHint;
                const visual = getToolIcon(item.slugHint, item.label);

                return (
                  <button
                    key={item.slugHint}
                    type="button"
                    role="listitem"
                    className={clsx(
                      "home-tool-accordion-grid__card",
                      isSelected && "home-tool-accordion-grid__card--selected",
                    )}
                    aria-expanded={isSelected}
                    aria-controls={panelId}
                    onClick={() => onCardClick(item.slugHint)}
                  >
                    <span
                      className={clsx(TOOL_ICON_BARE_CLASS, "home-tool-accordion-grid__icon")}
                      aria-hidden
                    >
                      {visual.icon}
                    </span>
                    <span className="home-tool-accordion-grid__label">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div
              id={panelId}
              className={clsx(
                "home-tool-accordion-grid__panel-wrap",
                isRowOpen && "home-tool-accordion-grid__panel-wrap--open",
              )}
              aria-hidden={!isRowOpen}
            >
              <div className="home-tool-accordion-grid__panel">
                {isRowOpen && selectedItem ? (
                  <div className="home-tool-accordion-grid__panel-inner">
                    <p className="home-tool-accordion-grid__description">{selectedItem.description}</p>
                    <Link
                      href={selectedItem.href}
                      className="home-tool-accordion-grid__cta"
                      prefetch={false}
                    >
                      {t("goToTool", { toolName: selectedItem.label })}
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
