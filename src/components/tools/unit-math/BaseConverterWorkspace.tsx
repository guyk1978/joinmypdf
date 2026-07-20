"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { BaseConverter, type BaseConverterLabels } from "@/components/tools/unit-math/BaseConverter";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type BaseConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function BaseConverterWorkspace({ tool, slug }: BaseConverterWorkspaceProps) {
  const t = useTranslations("BaseConverter");
  const tPage = useTranslations("BaseConverterPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<BaseConverterLabels>(
    () => ({
      sourceLabel: t("sourceLabel"),
      sourcePlaceholder: t("sourcePlaceholder"),
      fromBaseLabel: t("fromBaseLabel"),
      toBaseLabel: t("toBaseLabel"),
      liveResultLabel: t("liveResultLabel"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      resetButton: t("resetButton"),
      emptyHint: t("emptyHint"),
      invalidDigits: t("invalidDigits"),
      privacyLabel: t("privacyLabel"),
      pageTitle: tPage("title"),
      binary: t("binary"),
      octal: t("octal"),
      decimal: t("decimal"),
      hexadecimal: t("hexadecimal"),
      bitwiseTitle: t("bitwiseTitle"),
      bitwiseHint: t("bitwiseHint"),
      bitwiseEnable: t("bitwiseEnable"),
      bitwiseOperandLabel: t("bitwiseOperandLabel"),
      bitwiseOperandPlaceholder: t("bitwiseOperandPlaceholder"),
      bitwiseOpLabel: t("bitwiseOpLabel"),
      bitwiseAnd: t("bitwiseAnd"),
      bitwiseOr: t("bitwiseOr"),
      bitwiseXor: t("bitwiseXor"),
      bitwiseBinaryLabel: t("bitwiseBinaryLabel"),
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="base-converter-tool-page">
      <BaseConverter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
