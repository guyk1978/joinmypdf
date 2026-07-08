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
          <div key={`${item.q}-${index}`} className="faq-accordion__item border-b border-neutral-800 rounded-none">
            <button
              id={buttonId}
              type="button"
              className="faq-accordion__trigger flex w-full items-center justify-between gap-4 py-6 text-left rounded-none"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="text-xl font-bold tracking-tight text-white">{item.q}</span>
              <ChevronDown
                className={[
                  "faq-accordion__chevron h-5 w-5 shrink-0 text-neutral-400",
                  "transform transition-transform duration-500 ease-in-out",
                  isOpen ? "rotate-180" : "rotate-0",
                ].join(" ")}
                aria-hidden
                strokeWidth={2}
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={[
                "faq-accordion__panel overflow-hidden",
                "transition-all duration-500 ease-in-out",
                isOpen ? "max-h-[48rem]" : "max-h-0",
              ].join(" ")}
            >
              <p
                className={[
                  "faq-accordion__answer pb-6 pr-10 text-lg leading-relaxed text-slate-300",
                  "transition-opacity duration-500 ease-in-out",
                  isOpen ? "opacity-100 delay-75" : "opacity-0 delay-0",
                ].join(" ")}
              >
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
