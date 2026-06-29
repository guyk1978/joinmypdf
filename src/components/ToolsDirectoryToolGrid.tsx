"use client";

import { Fragment, useId, useState } from "react";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { ToolGridCard } from "@/components/ToolGridCard";
import { useToolGridColumns } from "@/hooks/useToolGridColumns";
import { chunkToolGridRows, type ToolGridItem } from "@/lib/tool-grid";
import { imBtnCta, imPanelExpanded } from "@/lib/design-system";

type ToolsDirectoryToolGridProps = {
  items: ToolGridItem[];
  className?: string;
};

export function ToolsDirectoryToolGrid({ items, className }: ToolsDirectoryToolGridProps) {
  const t = useTranslations("Home");
  const columns = useToolGridColumns();
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const baseId = useId();

  const selectedIndex = selectedToolId
    ? items.findIndex((item) => item.slugHint === selectedToolId)
    : -1;
  const selectedRow = selectedIndex >= 0 ? Math.floor(selectedIndex / columns) : -1;
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null;
  const rows = chunkToolGridRows(items, columns);

  const onCardToggle = (slug: string) => {
    setSelectedToolId((current) => (current === slug ? null : slug));
  };

  return (
    <div className={clsx("tools-directory-accordion-grid", className)}>
      {rows.map((row, rowIndex) => {
        const isRowOpen = selectedRow === rowIndex && Boolean(selectedItem);
        const panelId = `${baseId}-panel-row-${rowIndex}`;

        return (
          <Fragment key={rowIndex}>
            <div className="tools-directory-accordion-grid__row" role="list">
              {row.map((item) => (
                <ToolGridCard
                  key={item.href}
                  item={item}
                  accordion={{
                    isSelected: selectedToolId === item.slugHint,
                    onToggle: () => onCardToggle(item.slugHint),
                    panelId,
                  }}
                />
              ))}
            </div>

            <div
              id={panelId}
              className={clsx(
                "tools-directory-accordion-grid__panel-wrap",
                isRowOpen && "tools-directory-accordion-grid__panel-wrap--open",
              )}
              aria-hidden={!isRowOpen}
            >
              <div className="tools-directory-accordion-grid__panel">
                {isRowOpen && selectedItem ? (
                  <div className={clsx(imPanelExpanded, "tools-directory-accordion-grid__panel-inner")}>
                    {selectedItem.description ? (
                      <p className="im-panel-expanded__description tools-directory-accordion-grid__description">
                        {selectedItem.description}
                      </p>
                    ) : null}
                    <Link
                      href={selectedItem.href}
                      className={clsx(imBtnCta, "tools-directory-accordion-grid__cta")}
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
