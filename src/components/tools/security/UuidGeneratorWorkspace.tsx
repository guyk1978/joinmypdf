"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import { UuidGenerator, type UuidGeneratorLabels } from "@/components/tools/security/UuidGenerator";

type UuidGeneratorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function UuidGeneratorWorkspace({ tool, slug }: UuidGeneratorWorkspaceProps) {
  const t = useTranslations("UuidGenerator");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<UuidGeneratorLabels>(
    () => ({
      versionLabel: t("versionLabel"),
      bulkLabel: t("bulkLabel"),
      generateButton: t("generateButton"),
      copyAllButton: t("copyAllButton"),
      copyOneButton: t("copyOneButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      outputLabel: t("outputLabel"),
      outputEmpty: t("outputEmpty"),
      unsupportedError: t("unsupportedError"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="uuid-generator-tool-page">
      <UuidGenerator labels={labels} />
    </UtilityWorkspaceShell>
  );
}
