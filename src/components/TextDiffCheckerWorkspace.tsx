"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { TextDiffChecker, type TextDiffCheckerLabels } from "@/components/TextDiffChecker";
import { ToolLayout } from "@/components/utility/ToolLayout";
import type { ToolDefinition } from "@/lib/types";

type TextDiffCheckerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function TextDiffCheckerWorkspace({ tool, slug }: TextDiffCheckerWorkspaceProps) {
  const t = useTranslations("TextDiffChecker");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<TextDiffCheckerLabels>(
    () => ({
      originalLabel: t("originalLabel"),
      originalPlaceholder: t("originalPlaceholder"),
      changedLabel: t("changedLabel"),
      changedPlaceholder: t("changedPlaceholder"),
      compareButton: t("compareButton"),
      resultOriginalLabel: t("resultOriginalLabel"),
      resultChangedLabel: t("resultChangedLabel"),
      emptyDiff: t("emptyDiff"),
      statsLabel: t("statsLabel"),
    }),
    [t],
  );

  return (
    <ToolLayout pageClassName="text-diff-tool-page">
      <TextDiffChecker labels={labels} />
    </ToolLayout>
  );
}
