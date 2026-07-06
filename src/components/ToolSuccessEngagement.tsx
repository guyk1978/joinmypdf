"use client";

import { clsx } from "clsx";
import { RatingWidget } from "@/components/RatingWidget";
import { ToolSuccessFeedback } from "@/components/ToolSuccessFeedback";

type ToolSuccessEngagementProps = {
  pageTitle: string;
  fileContext?: string;
  className?: string;
};

/** Compact rating + feedback pair shown after a tool finishes successfully. */
export function ToolSuccessEngagement({ pageTitle, fileContext, className }: ToolSuccessEngagementProps) {
  return (
    <div className={clsx("tool-success-engagement", className)}>
      <RatingWidget pageTitle={pageTitle} fileContext={fileContext} />
      <ToolSuccessFeedback pageTitle={pageTitle} fileContext={fileContext} />
    </div>
  );
}
