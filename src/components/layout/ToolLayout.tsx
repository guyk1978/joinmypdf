"use client";

import type { CSSProperties, ReactNode } from "react";
import { clsx } from "clsx";
import { AdContainer } from "@/components/AdContainer";
import { FaqSection } from "@/components/layout/FaqSection";
import { FeedbackSection } from "@/components/layout/FeedbackSection";
import { ToolPageViewShell } from "@/components/layout/ToolPageViewShell";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { ToolLocalProcessingBar } from "@/components/ToolLocalProcessingBar";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { ToolPageInfoBlock } from "@/components/ToolPageInfoBlock";
import { WorkerErrorBoundary } from "@/components/workers/WorkerErrorBoundary";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import {
  getCategoryAccentCssVar,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
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
  /** DOC tab — SEO / educational blocks (Before you start, guides, etc.). */
  marketing?: ReactNode;
  /** RELATED tab — related tools grid. */
  related?: ReactNode;
  /** Optional block between the tool workspace and marketing (e.g. invoice templates). */
  belowTool?: ReactNode;
  className?: string;
  contentClassName?: string;
  showPrivacyBadge?: boolean;
  showHeader?: boolean;
};

/**
 * Canonical Industrial Matte layout for every tool page:
 * themed tabs → CALC workspace | DOC articles | RELATED tools.
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
  related,
  belowTool,
  className,
  contentClassName,
  showPrivacyBadge = true,
  showHeader = true,
}: ToolLayoutProps) {
  const shell = useToolPageShell();
  const embed = useToolEmbedMode();

  const resolvedTitle = title ?? shell.headline;
  const resolvedDescription = description ?? shell.subline;
  const resolvedTagline = tagline ?? shell.tagline;
  const resolvedSlug = slug ?? shell.slug;
  const feedbackPageTitle = feedbackTitle ?? resolvedTitle;
  const categoryId = resolveToolCategoryId(resolvedSlug);
  const accentStyle = categoryId
    ? ({ "--category-accent": getCategoryAccentCssVar(categoryId) } as CSSProperties)
    : undefined;

  const calcPane = (
    <>
      <div className={clsx("tool-page-layout__content", contentClassName)}>
        <WorkerErrorBoundary>{children}</WorkerErrorBoundary>
      </div>

      {showPrivacyBadge ? (
        <footer className="tool-page-layout__footer">
          <ToolLocalProcessingBar />
        </footer>
      ) : null}

      {resolvedSlug ? <AdContainer /> : null}
      {belowTool}
    </>
  );

  const hasDoc = Boolean(marketing) || faqs.length > 0;
  const docPane = hasDoc ? (
    <ToolPageInfoBlock className={toolPageInfoWidth}>
      {marketing}
      <FaqSection faqs={faqs} heading={faqHeading} />
      <FeedbackSection pageTitle={feedbackPageTitle} />
    </ToolPageInfoBlock>
  ) : null;

  if (embed) {
    return (
      <div
        id={WORKSPACE_UPLOAD_ID}
        className={clsx(
          "tool-page-layout tool-upload-stack flex w-full flex-col",
          "tool-page-layout--embed",
          className,
        )}
        data-category={categoryId || undefined}
        style={accentStyle}
      >
        <div className={clsx("tool-page-layout__content", contentClassName)}>
          <WorkerErrorBoundary>{children}</WorkerErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <div
      id={WORKSPACE_UPLOAD_ID}
      className={clsx(
        "tool-page-layout tool-upload-stack flex w-full flex-col",
        shell.stacked && "tool-page-layout--stacked",
        className,
      )}
      data-category={categoryId || undefined}
      style={accentStyle}
    >
      {breadcrumbs ? (
        <div className="tool-page-layout__breadcrumbs">{breadcrumbs}</div>
      ) : null}

      {showHeader && resolvedTitle ? (
        <ToolPageHeader
          title={resolvedTitle}
          description={resolvedDescription}
          tagline={resolvedTagline}
          slug={resolvedSlug}
        />
      ) : null}

      <ToolPageViewShell calc={calcPane} doc={docPane} related={related} />
    </div>
  );
}
