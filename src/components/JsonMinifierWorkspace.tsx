"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { JsonMinifier, type JsonMinifierLabels } from "@/components/JsonMinifier";
import { ToolLayout } from "@/components/utility/ToolLayout";
import type { ToolDefinition } from "@/lib/types";

type JsonMinifierWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function JsonMinifierWorkspace({ tool, slug }: JsonMinifierWorkspaceProps) {
  const t = useTranslations("JsonMinifier");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<JsonMinifierLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      minifyButton: t("minifyButton"),
      outputLabel: t("outputLabel"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
    }),
    [t],
  );

  return (
    <ToolLayout pageClassName="json-minifier-tool-page">
      <JsonMinifier labels={labels} />
    </ToolLayout>
  );
}
