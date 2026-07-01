"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { JsonToCsv, type JsonToCsvLabels } from "@/components/JsonToCsv";
import { ToolLayout } from "@/components/utility/ToolLayout";
import type { ToolDefinition } from "@/lib/types";

type JsonToCsvWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function JsonToCsvWorkspace({ tool, slug }: JsonToCsvWorkspaceProps) {
  const t = useTranslations("JsonToCsv");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<JsonToCsvLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      convertButton: t("convertButton"),
      previewLabel: t("previewLabel"),
      previewMoreRows: t("previewMoreRows"),
      downloadButton: t("downloadButton"),
      emptyInput: t("emptyInput"),
    }),
    [t],
  );

  return (
    <ToolLayout pageClassName="json-to-csv-tool-page">
      <JsonToCsv labels={labels} />
    </ToolLayout>
  );
}
