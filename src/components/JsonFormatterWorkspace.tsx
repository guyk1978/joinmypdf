"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { JsonFormatter, type JsonFormatterLabels } from "@/components/JsonFormatter";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type JsonFormatterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function JsonFormatterWorkspace({ tool, slug }: JsonFormatterWorkspaceProps) {
  const t = useTranslations("JsonFormatter");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<JsonFormatterLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      formatButton: t("formatButton"),
      outputLabel: t("outputLabel"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      emptyInput: t("emptyInput"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="json-formatter-tool-page">
      <JsonFormatter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
