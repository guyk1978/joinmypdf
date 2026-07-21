"use client";

import type { CSSProperties, ReactNode } from "react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { AdContainer } from "@/components/AdContainer";
import { FaqSection } from "@/components/layout/FaqSection";
import { FeedbackSection } from "@/components/layout/FeedbackSection";
import { ToolDocBodySections } from "@/components/layout/ToolDocBodySections";
import { ToolDocHeader } from "@/components/layout/ToolDocHeader";
import { ToolPageViewShell } from "@/components/layout/ToolPageViewShell";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { ToolLocalProcessingBar } from "@/components/ToolLocalProcessingBar";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { ToolPageInfoBlock } from "@/components/ToolPageInfoBlock";
import { WorkerErrorBoundary } from "@/components/workers/WorkerErrorBoundary";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { registry } from "@/lib/registry";
import {
  getCategoryAccentCssVar,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import { resolveLocalizedToolDocFields } from "@/lib/tool-doc-content";
import { parseToolHierarchyPath } from "@/lib/tool-hierarchy";
import type { ToolFaq } from "@/lib/types";
import { toolPageInfoWidth } from "@/lib/tool-ui";
import { WORKSPACE_UPLOAD_ID } from "@/lib/workspace-flow";
import { usePathname } from "@/i18n/navigation";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import type { ToolBreadcrumbItem } from "@/components/layout/ToolBreadcrumbs";

export type ToolLayoutProps = {
  children: ReactNode;
  /**
   * @deprecated Visible CALC breadcrumbs are disabled. Pass `docBreadcrumbs` for DOC,
   * or omit and let ToolDocHeader build the trail from slug.
   */
  breadcrumbs?: ReactNode;
  /** Optional crumb trail for the DOC masthead. */
  docBreadcrumbs?: ToolBreadcrumbItem[];
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
  /**
   * Extra DOC content (e.g. invoice templates). Formerly rendered under CALC;
   * always consolidated into the DOC pane.
   */
  belowTool?: ReactNode;
  /** Optional parent category override (from hub context / nested URL). */
  categoryId?: InventoryCategoryId;
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
  breadcrumbs: _breadcrumbs,
  docBreadcrumbs,
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
  categoryId: categoryIdProp,
  className,
  contentClassName,
  showPrivacyBadge = true,
  /** Body H1/description — off by default; tool name lives in DOC. */
  showHeader = false,
}: ToolLayoutProps) {
  const shell = useToolPageShell();
  const embed = useToolEmbedMode();
  const pathname = usePathname();
  const locale = useLocale();
  const tTools = useTranslations("Tools");

  const resolvedTitle = title ?? shell.headline;
  const resolvedDescription = description ?? shell.subline;
  const resolvedTagline = tagline ?? shell.tagline;
  const resolvedSlug = slug ?? shell.slug;
  const feedbackPageTitle = feedbackTitle ?? resolvedTitle;
  const registryTool = resolvedSlug
    ? registry.tools.find((entry) => entry.slug === resolvedSlug)
    : undefined;
  const docFields = resolvedSlug
    ? resolveLocalizedToolDocFields({
        slug: resolvedSlug,
        locale,
        tTools,
        title: resolvedTitle,
        description: resolvedDescription || resolvedTagline,
        intent: resolvedTagline,
        whyItMatters:
          locale === "en" ? registryTool?.documentation?.whyItMatters ?? null : null,
        useCases: locale === "en" ? registryTool?.useCases ?? null : null,
      })
    : null;

  const hierarchy = parseToolHierarchyPath(pathname);
  const categoryId =
    categoryIdProp ??
    hierarchy?.categoryId ??
    resolveToolCategoryId(resolvedSlug);
  const accentStyle = categoryId
    ? ({ "--category-accent": getCategoryAccentCssVar(categoryId) } as CSSProperties)
    : undefined;

  // CALC = interactive workspace only (no titles, crumbs, docs, or privacy chrome).
  const calcPane = (
    <>
      <div className={clsx("tool-page-layout__content", contentClassName)}>
        <WorkerErrorBoundary>{children}</WorkerErrorBoundary>
      </div>
      {resolvedSlug ? <AdContainer /> : null}
    </>
  );

  const hasDoc =
    Boolean(marketing) || Boolean(belowTool) || faqs.length > 0 || Boolean(docFields?.title || resolvedTitle);

  const docPane = hasDoc ? (
    <ToolPageInfoBlock className={clsx(toolPageInfoWidth, "tool-modal-docs")}>
      {resolvedSlug && docFields ? (
        <ToolDocHeader
          slug={resolvedSlug}
          title={docFields.title}
          description={docFields.description || docFields.intent}
          categoryId={categoryId}
          breadcrumbItems={docBreadcrumbs}
        />
      ) : null}
      {resolvedSlug && docFields ? (
        <ToolDocBodySections
          slug={resolvedSlug}
          title={docFields.title}
          description={docFields.description}
          intent={docFields.intent}
          whyItMatters={docFields.whyItMatters}
          useCases={docFields.useCases}
          primaryKeyword={docFields.primaryKeyword}
        />
      ) : null}
      {marketing}
      {belowTool}
      <FaqSection faqs={faqs} heading={faqHeading} />
      <FeedbackSection pageTitle={feedbackPageTitle} />
      {showPrivacyBadge ? (
        <div className="tool-page-layout__doc-privacy">
          <ToolLocalProcessingBar />
        </div>
      ) : null}
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
