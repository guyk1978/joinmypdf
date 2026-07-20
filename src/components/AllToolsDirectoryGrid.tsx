"use client";

import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";

export type AllToolsDirectoryCategory = {
  id: string;
  title: string;
  tools: { href: string; label: string; slugHint: string }[];
};

type AllToolsDirectoryGridProps = {
  categories: AllToolsDirectoryCategory[];
  expandLabel: string;
  collapseLabel: string;
};

type CategoryWithIndex = AllToolsDirectoryCategory & { index: number };

function splitIntoColumns(categories: AllToolsDirectoryCategory[]): [CategoryWithIndex[], CategoryWithIndex[]] {
  const left: CategoryWithIndex[] = [];
  const right: CategoryWithIndex[] = [];

  categories.forEach((category, index) => {
    const entry = { ...category, index };
    if (index % 2 === 0) left.push(entry);
    else right.push(entry);
  });

  return [left, right];
}

export function AllToolsDirectoryGrid({
  categories,
  expandLabel,
  collapseLabel,
}: AllToolsDirectoryGridProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [leftColumn, rightColumn] = useMemo(() => splitIntoColumns(categories), [categories]);

  const toggle = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const renderCard = (category: CategoryWithIndex) => {
    const isOpen = openIds.has(category.id);
    const toggleLabel = isOpen ? collapseLabel : expandLabel;

    return (
      <article
        key={category.id}
        style={{ order: category.index }}
        className={clsx("all-tools-directory-card", isOpen && "all-tools-directory-card--open")}
      >
        <button
          type="button"
          className="all-tools-directory-card__header"
          aria-expanded={isOpen}
          aria-controls={`all-tools-panel-${category.id}`}
          onClick={() => toggle(category.id)}
        >
          <h2 className="all-tools-directory-card__title">{category.title}</h2>
          <span className="all-tools-directory-card__toggle" aria-hidden>
            <ChevronDown
              className={clsx(
                "all-tools-directory-card__chevron",
                isOpen && "all-tools-directory-card__chevron--open",
              )}
            />
          </span>
          <span className="sr-only">{toggleLabel}</span>
        </button>

        <div
          id={`all-tools-panel-${category.id}`}
          className={clsx(
            "all-tools-directory-card__panel",
            isOpen && "all-tools-directory-card__panel--open",
          )}
        >
          <div className="all-tools-directory-card__panel-inner">
            <ul className="all-tools-directory-card__tools">
              {category.tools.map((tool) => (
                <li key={tool.slugHint}>
                  <Link
                    href={tool.href}
                    className="all-tools-directory-card__tool-link"
                    prefetch={false}
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="all-tools-directory-grid">
      <div className="all-tools-directory-column">{leftColumn.map(renderCard)}</div>
      <div className="all-tools-directory-column">{rightColumn.map(renderCard)}</div>
    </div>
  );
}
