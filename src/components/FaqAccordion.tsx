"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

export type FaqAccordionItem = {
  q: string;
  a: string;
};

export type FaqAccordionProps = {
  items: readonly FaqAccordionItem[];
  className?: string;
};

export function FaqAccordion({ items, className }: FaqAccordionProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!items.length) return null;

  return (
    <div className={clsx("faq-accordion", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div
            key={`${item.q}-${index}`}
            className={clsx("faq-accordion__item", isOpen && "is-open")}
          >
            <button
              id={buttonId}
              type="button"
              className="faq-accordion__trigger"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="faq-accordion__question">{item.q}</span>
              <ChevronDown
                className={clsx(
                  "faq-accordion__chevron",
                  isOpen && "faq-accordion__chevron--open",
                )}
                aria-hidden
                strokeWidth={2}
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={clsx(
                "faq-accordion__panel",
                isOpen && "faq-accordion__panel--open",
              )}
            >
              <div className="faq-accordion__panel-inner">
                <p className="faq-accordion__answer">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
