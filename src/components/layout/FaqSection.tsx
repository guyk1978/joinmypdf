"use client";

import { useTranslations } from "next-intl";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import type { ToolFaq } from "@/lib/types";

export type FaqSectionProps = {
  faqs: ToolFaq[];
  heading?: string;
};

export function FaqSection({ faqs, heading }: FaqSectionProps) {
  const t = useTranslations("ToolModal");

  if (!faqs.length) return null;

  return (
    <ToolPageDashboardSection aria-labelledby="tool-faq-heading">
      <h2
        id="tool-faq-heading"
        className="mb-6 text-[1.25rem] font-bold tracking-tight text-white sm:text-2xl"
      >
        {heading ?? t("faq")}
      </h2>
      <FaqAccordion items={faqs} />
    </ToolPageDashboardSection>
  );
}
