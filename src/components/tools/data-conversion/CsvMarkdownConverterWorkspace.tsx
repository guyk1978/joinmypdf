"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import {
  CsvMarkdownConverter,
  type CsvMarkdownConverterLabels,
} from "@/components/tools/data-conversion/CsvMarkdownConverter";

type CsvMarkdownConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function CsvMarkdownConverterWorkspace({ tool, slug }: CsvMarkdownConverterWorkspaceProps) {
  const t = useTranslations("CsvMarkdownConverter");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<CsvMarkdownConverterLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      outputLabel: t("outputLabel"),
      outputEmpty: t("outputEmpty"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      errorEmpty: t("errorEmpty"),
      errorParse: t("errorParse"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="csv-markdown-tool-page">
      <CsvMarkdownConverter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
