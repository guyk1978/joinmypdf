"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ToolLayout } from "@/components/utility/ToolLayout";
import type { ToolDefinition } from "@/lib/types";
import {
  ReadingTimeCalculator,
  type ReadingTimeCalculatorLabels,
} from "@/components/tools/productivity/ReadingTimeCalculator";

type ReadingTimeCalculatorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ReadingTimeCalculatorWorkspace({ tool, slug }: ReadingTimeCalculatorWorkspaceProps) {
  const t = useTranslations("ReadingTimeCalculator");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ReadingTimeCalculatorLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      resetButton: t("resetButton"),
      resultLabel: t("resultLabel"),
      resultValue: t("resultValue"),
      wordsLabel: t("wordsLabel"),
      emptyHint: t("emptyHint"),
    }),
    [t],
  );

  return (
    <ToolLayout pageClassName="reading-time-tool-page">
      <ReadingTimeCalculator labels={labels} />
    </ToolLayout>
  );
}
