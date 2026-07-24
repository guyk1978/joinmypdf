"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

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
    <div className={["faq-accordion", className].filter(Boolean).join(" ")}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div key={`${item.q}-${index}`} className="faq-accordion__item">
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
                className={[
                  "faq-accordion__chevron",
                  isOpen ? "faq-accordion__chevron--open" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden
                strokeWidth={2}
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={[
                "faq-accordion__panel",
                isOpen ? "faq-accordion__panel--open" : "",
              ]
                .filter(Boolean)
                .join(" ")}
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
