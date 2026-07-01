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
