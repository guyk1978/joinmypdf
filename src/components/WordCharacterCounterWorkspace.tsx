"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  WordCharacterCounter,
  type WordCharacterCounterLabels,
} from "@/components/WordCharacterCounter";
import { ToolLayout } from "@/components/utility/ToolLayout";
import type { ToolDefinition } from "@/lib/types";

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
      statsTitle: t("statsTitle"),
      charactersWithSpacesLabel: t("charactersWithSpacesLabel"),
      charactersWithoutSpacesLabel: t("charactersWithoutSpacesLabel"),
      wordsLabel: t("wordsLabel"),
      paragraphsLabel: t("paragraphsLabel"),
      readingTimeLabel: t("readingTimeLabel"),
      readingTimeValue: t("readingTimeValue"),
    }),
    [t],
  );

  return (
    <ToolLayout pageClassName="text-counter-tool-page">
      <WordCharacterCounter labels={labels} />
    </ToolLayout>
  );
}
