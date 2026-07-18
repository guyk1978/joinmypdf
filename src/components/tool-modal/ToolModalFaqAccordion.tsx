"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

export type ToolModalFaqItem = {
  question: string;
  answer: string;
};

type ToolModalFaqAccordionProps = {
  items: readonly ToolModalFaqItem[];
  className?: string;
  expandAllLabel?: string;
  collapseAllLabel?: string;
  /** High-value FAQs left open for crawlers + first paint (default 4). */
  defaultOpenCount?: number;
};

const DEFAULT_OPEN_COUNT = 4;

/**
 * FAQ list for the tool modal DOC tab.
 * Uses semantic `<details>` / `<summary>` so answers stay in the DOM for crawlers,
 * with the first few items expanded by default.
 */
export function ToolModalFaqAccordion({
  items,
  className,
  expandAllLabel = "Expand all",
  collapseAllLabel = "Collapse all",
  defaultOpenCount = DEFAULT_OPEN_COUNT,
}: ToolModalFaqAccordionProps) {
  const baseId = useId();

  const itemsKey = useMemo(
    () => items.map((item) => item.question).join("\0"),
    [items],
  );

  const initialOpen = useMemo(
    () => items.map((_, index) => index < Math.max(0, defaultOpenCount)),
    [items, defaultOpenCount],
  );

  const [openFlags, setOpenFlags] = useState<boolean[]>(initialOpen);

  useEffect(() => {
    setOpenFlags(items.map((_, index) => index < Math.max(0, defaultOpenCount)));
  }, [itemsKey, items, defaultOpenCount]);

  if (!items.length) return null;

  const allOpen = openFlags.length > 0 && openFlags.every(Boolean);
  const noneOpen = openFlags.every((flag) => !flag);

  const expandAll = () => {
    setOpenFlags(items.map(() => true));
  };

  const collapseAll = () => {
    setOpenFlags(items.map(() => false));
  };

  return (
    <div className={clsx("tool-modal-faq", className)}>
      <div className="tool-modal-faq__toolbar">
        <button
          type="button"
          className="tool-modal-faq__bulk"
          onClick={expandAll}
          disabled={allOpen}
        >
          {expandAllLabel}
        </button>
        <span className="tool-modal-faq__toolbar-sep" aria-hidden>
          /
        </span>
        <button
          type="button"
          className="tool-modal-faq__bulk"
          onClick={collapseAll}
          disabled={noneOpen}
        >
          {collapseAllLabel}
        </button>
      </div>

      <div className="tool-modal-faq__scroll">
        {items.map((item, index) => {
          const isOpen = openFlags[index] === true;
          const panelId = `${baseId}-panel-${index}`;
          const summaryId = `${baseId}-summary-${index}`;

          return (
            <details
              key={`${item.question}-${index}`}
              className={clsx(
                "tool-modal-faq__item",
                isOpen && "tool-modal-faq__item--open",
              )}
              open={isOpen}
              onToggle={(event) => {
                const nextOpen = event.currentTarget.open;
                setOpenFlags((current) =>
                  current.map((flag, i) => (i === index ? nextOpen : flag)),
                );
              }}
            >
              <summary
                id={summaryId}
                className={clsx(
                  "tool-modal-faq__trigger",
                  isOpen && "tool-modal-faq__trigger--open",
                )}
              >
                <span className="tool-modal-faq__question">{item.question}</span>
                <span className="tool-modal-faq__icon" aria-hidden>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className={clsx(
                      "tool-modal-faq__chevron",
                      isOpen && "tool-modal-faq__chevron--open",
                    )}
                  />
                </span>
              </summary>

              <div
                id={panelId}
                className="tool-modal-faq__panel tool-modal-faq__panel--open"
                role="region"
                aria-labelledby={summaryId}
              >
                <p className="tool-modal-faq__answer">{item.answer}</p>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
