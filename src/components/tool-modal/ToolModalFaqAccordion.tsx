"use client";

import { useId, useState } from "react";
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

export function faqItemsKey(items: readonly ToolModalFaqItem[]): string {
  return items.map((item) => item.question).join("\0");
}

/**
 * FAQ list for the tool modal DOC tab.
 * Remount via parent `key={faqItemsKey(items)}` when content changes —
 * do not sync open flags in an effect (that caused max-update-depth loops).
 */
export function ToolModalFaqAccordion({
  items,
  className,
  expandAllLabel = "Expand all",
  collapseAllLabel = "Collapse all",
  defaultOpenCount = DEFAULT_OPEN_COUNT,
}: ToolModalFaqAccordionProps) {
  const baseId = useId();

  const [openFlags, setOpenFlags] = useState(() =>
    items.map((_, index) => index < Math.max(0, defaultOpenCount)),
  );

  if (!items.length) return null;

  const allOpen = openFlags.length > 0 && openFlags.every(Boolean);
  const noneOpen = openFlags.every((flag) => !flag);

  const expandAll = () => {
    setOpenFlags(items.map(() => true));
  };

  const collapseAll = () => {
    setOpenFlags(items.map(() => false));
  };

  const toggleIndex = (index: number) => {
    setOpenFlags((current) =>
      current.map((flag, i) => (i === index ? !flag : flag)),
    );
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
        <button
          type="button"
          className="tool-modal-faq__bulk"
          onClick={collapseAll}
          disabled={noneOpen}
        >
          {collapseAllLabel}
        </button>
      </div>
      <div className="tool-modal-faq__list">
        {items.map((item, index) => {
          const open = Boolean(openFlags[index]);
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;
          return (
            <div
              key={`${item.question}-${index}`}
              className={clsx("tool-modal-faq__item", open && "is-open")}
            >
              <button
                type="button"
                id={buttonId}
                className="tool-modal-faq__trigger"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggleIndex(index)}
              >
                <span className="tool-modal-faq__question">{item.question}</span>
                <ChevronDown className="tool-modal-faq__chevron" aria-hidden />
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="tool-modal-faq__panel"
                style={{
                  gridTemplateRows: open ? "1fr" : "0fr",
                  opacity: open ? 1 : 0,
                }}
              >
                <div className="tool-modal-faq__panel-inner">
                  <p className="tool-modal-faq__answer">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
