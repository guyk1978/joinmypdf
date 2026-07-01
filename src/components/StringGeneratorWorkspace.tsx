"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { StringGenerator, type StringGeneratorLabels } from "@/components/StringGenerator";
import { ToolLayout } from "@/components/utility/ToolLayout";
import type { ToolDefinition } from "@/lib/types";

type StringGeneratorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function StringGeneratorWorkspace({ tool, slug }: StringGeneratorWorkspaceProps) {
  const t = useTranslations("StringGenerator");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<StringGeneratorLabels>(
    () => ({
      settingsTitle: t("settingsTitle"),
      lengthLabel: t("lengthLabel"),
      quantityLabel: t("quantityLabel"),
      uppercaseLabel: t("uppercaseLabel"),
      numbersLabel: t("numbersLabel"),
      specialLabel: t("specialLabel"),
      generateButton: t("generateButton"),
      uuidButton: t("uuidButton"),
      outputLabel: t("outputLabel"),
      copyButton: t("copyButton"),
      regenerateButton: t("regenerateButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
    }),
    [t],
  );

  return (
    <ToolLayout pageClassName="string-generator-tool-page">
      <StringGenerator labels={labels} />
    </ToolLayout>
  );
}
