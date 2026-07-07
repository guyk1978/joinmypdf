"use client";

import { useTranslations } from "next-intl";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";

export type FeedbackSectionProps = {
  pageTitle: string;
};

export function FeedbackSection({ pageTitle }: FeedbackSectionProps) {
  const t = useTranslations("Feedback");

  return (
    <ToolPageDashboardSection aria-labelledby="tool-feedback-heading">
      <h2
        id="tool-feedback-heading"
        className="mb-4 text-lg font-semibold tracking-wide text-ink dark:text-white"
      >
        {t("title")}
      </h2>
      <FeedbackWidget pageType="tool" pageTitle={pageTitle} />
    </ToolPageDashboardSection>
  );
}
