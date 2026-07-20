"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { TextSanitizer, type TextSanitizerLabels } from "@/components/TextSanitizer";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type TextSanitizerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function TextSanitizerWorkspace({ tool, slug }: TextSanitizerWorkspaceProps) {
  const t = useTranslations("TextSanitizer");
  const tPage = useTranslations("TextSanitizerPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<TextSanitizerLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      optionsTitle: t("optionsTitle"),
      optionFixLineBreaks: t("optionFixLineBreaks"),
      optionRemoveExtraSpaces: t("optionRemoveExtraSpaces"),
      optionCleanInvisible: t("optionCleanInvisible"),
      optionFixHebrew: t("optionFixHebrew"),
      cleanButton: t("cleanButton"),
      clearButton: t("clearButton"),
      outputLabel: t("outputLabel"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      diffLabel: t("diffLabel"),
      emptyHint: t("emptyHint"),
      errorEmpty: t("errorEmpty"),
      unchangedHint: t("unchangedHint"),
      privacyLabel: t("privacyLabel"),
      pageTitle: tPage("title"),
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="text-sanitizer-tool-page">
      <TextSanitizer labels={labels} />
    </UtilityWorkspaceShell>
  );
}
