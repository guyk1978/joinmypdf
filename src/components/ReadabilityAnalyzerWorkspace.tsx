"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  ReadabilityAnalyzer,
  type ReadabilityAnalyzerLabels,
} from "@/components/ReadabilityAnalyzer";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type ReadabilityAnalyzerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ReadabilityAnalyzerWorkspace({ tool, slug }: ReadabilityAnalyzerWorkspaceProps) {
  const t = useTranslations("ReadabilityAnalyzer");
  const tPage = useTranslations("ReadabilityAnalyzerPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ReadabilityAnalyzerLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      analyzeButton: t("analyzeButton"),
      clearButton: t("clearButton"),
      emptyHint: t("emptyHint"),
      errorEmpty: t("errorEmpty"),
      scoreTitle: t("scoreTitle"),
      scoreOf: t("scoreOf"),
      readingTimeTitle: t("readingTimeTitle"),
      readingTimeValue: t("readingTimeValue"),
      complexityTitle: t("complexityTitle"),
      longSentencesLabel: t("longSentencesLabel"),
      complexWordsLabel: t("complexWordsLabel"),
      noIssues: t("noIssues"),
      suggestionsTitle: t("suggestionsTitle"),
      suggestionArrow: t("suggestionArrow"),
      suggestionCount: t("suggestionCount"),
      noSuggestions: t("noSuggestions"),
      toneTitle: t("toneTitle"),
      toneProfessional: t("toneProfessional"),
      toneCasual: t("toneCasual"),
      toneAcademic: t("toneAcademic"),
      toneNeutral: t("toneNeutral"),
      levelVeryEasy: t("levelVeryEasy"),
      levelEasy: t("levelEasy"),
      levelFairlyEasy: t("levelFairlyEasy"),
      levelStandard: t("levelStandard"),
      levelFairlyDifficult: t("levelFairlyDifficult"),
      levelDifficult: t("levelDifficult"),
      levelVeryDifficult: t("levelVeryDifficult"),
      statsWords: t("statsWords"),
      statsSentences: t("statsSentences"),
      statsSyllables: t("statsSyllables"),
      legendLong: t("legendLong"),
      legendComplex: t("legendComplex"),
      privacyLabel: t("privacyLabel"),
      pageTitle: tPage("title"),
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell pageClassName="readability-analyzer-tool-page">
      <ReadabilityAnalyzer labels={labels} />
    </UtilityWorkspaceShell>
  );
}
