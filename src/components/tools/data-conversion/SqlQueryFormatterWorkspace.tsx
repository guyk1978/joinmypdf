"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import {
  SqlQueryFormatter,
  type SqlQueryFormatterLabels,
} from "@/components/tools/data-conversion/SqlQueryFormatter";

type SqlQueryFormatterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function SqlQueryFormatterWorkspace({ tool, slug }: SqlQueryFormatterWorkspaceProps) {
  const t = useTranslations("SqlQueryFormatter");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<SqlQueryFormatterLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      outputLabel: t("outputLabel"),
      outputEmpty: t("outputEmpty"),
      indentLabel: t("indentLabel"),
      indent2: t("indent2"),
      indent4: t("indent4"),
      indentTab: t("indentTab"),
      keywordsLabel: t("keywordsLabel"),
      keywordsUpper: t("keywordsUpper"),
      keywordsLower: t("keywordsLower"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      errorEmpty: t("errorEmpty"),
      errorParse: t("errorParse"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell pageClassName="sql-query-tool-page">
      <SqlQueryFormatter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
