"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { JsonCsvExplorer, type JsonCsvExplorerLabels } from "@/components/JsonCsvExplorer";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type JsonCsvExplorerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function JsonCsvExplorerWorkspace({ tool, slug }: JsonCsvExplorerWorkspaceProps) {
  const t = useTranslations("JsonCsvExplorer");
  const tPage = useTranslations("JsonCsvExplorerPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<JsonCsvExplorerLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      formatAuto: t("formatAuto"),
      formatJson: t("formatJson"),
      formatCsv: t("formatCsv"),
      parseButton: t("parseButton"),
      clearButton: t("clearButton"),
      searchLabel: t("searchLabel"),
      searchPlaceholder: t("searchPlaceholder"),
      columnPickerTitle: t("columnPickerTitle"),
      selectAll: t("selectAll"),
      selectNone: t("selectNone"),
      explorerTitle: t("explorerTitle"),
      emptyHint: t("emptyHint"),
      errorEmpty: t("errorEmpty"),
      errorInvalid: t("errorInvalid"),
      exportButton: t("exportButton"),
      copyPathHint: t("copyPathHint"),
      pathCopied: t("pathCopied"),
      rowsLabel: t("rowsLabel"),
      privacyLabel: t("privacyLabel"),
      pageTitle: tPage("title"),
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell pageClassName="json-csv-explorer-tool-page">
      <JsonCsvExplorer labels={labels} />
    </UtilityWorkspaceShell>
  );
}
