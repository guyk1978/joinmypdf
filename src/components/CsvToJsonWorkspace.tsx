"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { CsvToJson, type CsvToJsonLabels } from "@/components/CsvToJson";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type CsvToJsonWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function CsvToJsonWorkspace({ tool, slug }: CsvToJsonWorkspaceProps) {
  const t = useTranslations("CsvToJson");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<CsvToJsonLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      headersLabel: t("headersLabel"),
      convertButton: t("convertButton"),
      outputLabel: t("outputLabel"),
      copyButton: t("copyButton"),
      downloadButton: t("downloadButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell pageClassName="csv-to-json-tool-page">
      <CsvToJson labels={labels} />
    </UtilityWorkspaceShell>
  );
}
