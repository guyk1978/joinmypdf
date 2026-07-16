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
};

/**
 * Industrial Matte FAQ accordion for the tool modal DOC tab.
 * Answers are removed from the DOM when closed (no leftover visible text).
 */
export function ToolModalFaqAccordion({
  items,
  className,
  expandAllLabel = "Expand all",
  collapseAllLabel = "Collapse all",
}: ToolModalFaqAccordionProps) {
  const baseId = useId();

  const itemsKey = useMemo(
    () => items.map((item) => item.question).join("\0"),
    [items],
  );

  // One boolean per FAQ — all start closed.
  const [openFlags, setOpenFlags] = useState<boolean[]>(() =>
    items.map(() => false),
  );

  useEffect(() => {
    setOpenFlags(items.map(() => false));
  }, [itemsKey, items]);

  if (!items.length) return null;

  const allOpen = openFlags.length > 0 && openFlags.every(Boolean);
  const noneOpen = openFlags.every((flag) => !flag);

  const toggle = (index: number) => {
    setOpenFlags((current) =>
      current.map((isOpen, i) => (i === index ? !isOpen : isOpen)),
    );
  };

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

      <div className="tool-modal-faq__scroll" role="list">
        {items.map((item, index) => {
          const isOpen = openFlags[index] === true;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-btn-${index}`;

          return (
            <div
              key={`${item.question}-${index}`}
              className="tool-modal-faq__item"
              role="listitem"
            >
              <button
                id={buttonId}
                type="button"
                className={clsx(
                  "tool-modal-faq__trigger",
                  isOpen && "tool-modal-faq__trigger--open",
                )}
                aria-expanded={isOpen}
                aria-controls={isOpen ? panelId : undefined}
                onClick={() => toggle(index)}
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
              </button>

              {isOpen ? (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="tool-modal-faq__panel tool-modal-faq__panel--open"
                >
                  <p className="tool-modal-faq__answer">{item.answer}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
