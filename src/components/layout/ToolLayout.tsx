"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { AdContainer } from "@/components/AdContainer";
import { FaqSection } from "@/components/layout/FaqSection";
import { FeedbackSection } from "@/components/layout/FeedbackSection";
import { ToolLocalProcessingBar } from "@/components/ToolLocalProcessingBar";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { ToolPageInfoBlock } from "@/components/ToolPageInfoBlock";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import type { ToolFaq } from "@/lib/types";
import { toolPageInfoWidth } from "@/lib/tool-ui";
import { WORKSPACE_UPLOAD_ID } from "@/lib/workspace-flow";

export type ToolLayoutProps = {
  children: ReactNode;
  /** Visible breadcrumb trail rendered above the page title. */
  breadcrumbs?: ReactNode;
  /** Page H1 — falls back to ToolPageShellProvider headline when omitted. */
  title?: string;
  /** One-line description under the title. */
  description?: string;
  tagline?: string;
  slug?: string;
  faqs: ToolFaq[];
  faqHeading?: string;
  /** Feedback widget title — defaults to resolved page title. */
  feedbackTitle?: string;
  /** SEO / intro blocks rendered before FAQ (Before you start, related tools, etc.). */
  marketing?: ReactNode;
  /** Optional block between the tool workspace and marketing (e.g. invoice templates). */
  belowTool?: ReactNode;
  className?: string;
  contentClassName?: string;
  showPrivacyBadge?: boolean;
  showHeader?: boolean;
};

/**
 * Canonical Industrial Matte layout for every tool page:
 * title + description → tool workspace → marketing → FAQ → feedback.
 */
export function ToolLayout({
  children,
  breadcrumbs,
  title,
  description,
  tagline,
  slug,
  faqs,
  faqHeading,
  feedbackTitle,
  marketing,
  belowTool,
  className,
  contentClassName,
  showPrivacyBadge = true,
  showHeader = true,
}: ToolLayoutProps) {
  const shell = useToolPageShell();

  const resolvedTitle = title ?? shell.headline;
  const resolvedDescription = description ?? shell.subline;
  const resolvedTagline = tagline ?? shell.tagline;
  const resolvedSlug = slug ?? shell.slug;
  const feedbackPageTitle = feedbackTitle ?? resolvedTitle;

  return (
    <>
      <div
        id={WORKSPACE_UPLOAD_ID}
        className={clsx(
          "tool-page-layout tool-upload-stack flex w-full flex-col",
          shell.stacked && "tool-page-layout--stacked",
          className,
        )}
      >
        {breadcrumbs ? <div className="tool-page-layout__breadcrumbs">{breadcrumbs}</div> : null}

        {showHeader && resolvedTitle ? (
          <ToolPageHeader
            title={resolvedTitle}
            description={resolvedDescription}
            tagline={resolvedTagline}
            slug={resolvedSlug}
          />
        ) : null}

        <div className={clsx("tool-page-layout__content", contentClassName)}>{children}</div>

        {showPrivacyBadge ? (
          <footer className="tool-page-layout__footer">
            <ToolLocalProcessingBar />
          </footer>
        ) : null}

        {resolvedSlug ? <AdContainer /> : null}
      </div>

      {belowTool}

      <ToolPageInfoBlock className={toolPageInfoWidth}>
        {marketing}
        <FaqSection faqs={faqs} heading={faqHeading} />
        <FeedbackSection pageTitle={feedbackPageTitle} />
      </ToolPageInfoBlock>
    </>
  );
}
