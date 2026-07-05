"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  HtmlMarkdownConverter,
  type HtmlMarkdownConverterLabels,
} from "@/components/HtmlMarkdownConverter";
import { ToolLayout } from "@/components/utility/ToolLayout";
import type { ToolDefinition } from "@/lib/types";

type HtmlMarkdownConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function HtmlMarkdownConverterWorkspace({ tool, slug }: HtmlMarkdownConverterWorkspaceProps) {
  const t = useTranslations("HtmlMarkdownConverter");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<HtmlMarkdownConverterLabels>(
    () => ({
      localFirstBadge: t("localFirstBadge"),
      offlineReady: t("offlineReady"),
      clearAllButton: t("clearAllButton"),
      modeMarkdownToHtml: t("modeMarkdownToHtml"),
      modeHtmlToMarkdown: t("modeHtmlToMarkdown"),
      markdownInputLabel: t("markdownInputLabel"),
      htmlOutputLabel: t("htmlOutputLabel"),
      htmlInputLabel: t("htmlInputLabel"),
      markdownOutputLabel: t("markdownOutputLabel"),
      markdownPlaceholder: t("markdownPlaceholder"),
      htmlPlaceholder: t("htmlPlaceholder"),
      copyHtmlButton: t("copyHtmlButton"),
      copyMarkdownButton: t("copyMarkdownButton"),
      downloadHtmlButton: t("downloadHtmlButton"),
      downloadMarkdownButton: t("downloadMarkdownButton"),
      flavorLabel: t("flavorLabel"),
      flavorGfm: t("flavorGfm"),
      flavorCommonmark: t("flavorCommonmark"),
      syncScrollLabel: t("syncScrollLabel"),
      seoAuditTitle: t("seoAuditTitle"),
      seoAuditHint: t("seoAuditHint"),
      seoNoHtml: t("seoNoHtml"),
      seoH1Missing: t("seoH1Missing"),
      seoH1Multiple: t("seoH1Multiple"),
      seoHeadingSkip: t("seoHeadingSkip"),
      seoTooManyHeadings: t("seoTooManyHeadings"),
      seoImgMissingAlt: t("seoImgMissingAlt"),
      seoLongParagraph: t("seoLongParagraph"),
      seoStructureGood: t("seoStructureGood"),
      projectSectionTitle: t("projectSectionTitle"),
      projectSectionHint: t("projectSectionHint"),
      minifyHtmlLabel: t("minifyHtmlLabel"),
      includeCssLabel: t("includeCssLabel"),
      saveConfigButton: t("saveConfigButton"),
      configSaved: t("configSaved"),
      copyToProjectButton: t("copyToProjectButton"),
      gistExportButton: t("gistExportButton"),
      gistCopied: t("gistCopied"),
      batchLabel: t("batchLabel"),
      batchHint: t("batchHint"),
      batchConvertButton: t("batchConvertButton"),
      batchDownloadZip: t("batchDownloadZip"),
      batchResults: t("batchResults"),
      batchEmpty: t("batchEmpty"),
      batchProcessing: t("batchProcessing"),
      previewButton: t("previewButton"),
      codeButton: t("codeButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
    }),
    [t],
  );

  return (
    <ToolLayout pageClassName="html-md-converter-tool-page">
      <HtmlMarkdownConverter labels={labels} />
    </ToolLayout>
  );
}
