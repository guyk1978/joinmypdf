"use client";

import { useTranslations } from "next-intl";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import type { ToolFaq } from "@/lib/types";

export type FaqSectionProps = {
  faqs: ToolFaq[];
  heading?: string;
};

export function FaqSection({ faqs, heading }: FaqSectionProps) {
  const t = useTranslations("ToolPage");

  if (!faqs.length) return null;

  return (
    <ToolPageDashboardSection aria-labelledby="tool-faq-heading">
      <h2
        id="tool-faq-heading"
        className="mb-4 text-lg font-semibold tracking-wide text-ink dark:text-white"
      >
        {heading ?? t("questions")}
      </h2>
      <div className="tool-page-faq-list">
        {faqs.map((item) => (
          <details key={item.q} className="tool-page-faq-item">
            <summary className="cursor-pointer text-ink dark:text-white">{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </ToolPageDashboardSection>
  );
}
