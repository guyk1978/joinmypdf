"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import {
  YamlJsonConverter,
  type YamlJsonConverterLabels,
} from "@/components/tools/data-conversion/YamlJsonConverter";

type YamlJsonConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function YamlJsonConverterWorkspace({ tool, slug }: YamlJsonConverterWorkspaceProps) {
  const t = useTranslations("YamlJsonConverter");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<YamlJsonConverterLabels>(
    () => ({
      yamlInputLabel: t("yamlInputLabel"),
      jsonInputLabel: t("jsonInputLabel"),
      yamlOutputLabel: t("yamlOutputLabel"),
      jsonOutputLabel: t("jsonOutputLabel"),
      yamlPlaceholder: t("yamlPlaceholder"),
      jsonPlaceholder: t("jsonPlaceholder"),
      switchDirection: t("switchDirection"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      errorEmpty: t("errorEmpty"),
      errorParse: t("errorParse"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell pageClassName="yaml-json-tool-page">
      <YamlJsonConverter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
