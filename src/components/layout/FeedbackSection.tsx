"use client";

import { FeedbackWidget } from "@/components/FeedbackWidget";

export type FeedbackSectionProps = {
  pageTitle: string;
};

/** DOC-pane quick feedback — flush on the page canvas (no panel chrome). */
export function FeedbackSection({ pageTitle }: FeedbackSectionProps) {
  return <FeedbackWidget pageType="tool" pageTitle={pageTitle} />;
}
