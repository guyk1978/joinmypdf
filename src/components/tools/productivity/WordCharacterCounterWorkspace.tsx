"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import {
  WordCharacterCounter,
  type WordCharacterCounterLabels,
} from "@/components/tools/productivity/WordCharacterCounter";

type WordCharacterCounterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function WordCharacterCounterWorkspace({ tool, slug }: WordCharacterCounterWorkspaceProps) {
  const t = useTranslations("WordCharacterCounter");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<WordCharacterCounterLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      resetButton: t("resetButton"),
      charactersWithSpacesLabel: t("charactersWithSpacesLabel"),
      charactersWithoutSpacesLabel: t("charactersWithoutSpacesLabel"),
      wordsLabel: t("wordsLabel"),
      sentencesLabel: t("sentencesLabel"),
      paragraphsLabel: t("paragraphsLabel"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell pageClassName="productivity-counter-tool-page">
      <WordCharacterCounter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
