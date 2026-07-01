"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ToolLayout } from "@/components/utility/ToolLayout";
import type { ToolDefinition } from "@/lib/types";
import { UnitConverter, type UnitConverterLabels } from "@/components/tools/productivity/UnitConverter";

type UnitConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function UnitConverterWorkspace({ tool, slug }: UnitConverterWorkspaceProps) {
  const t = useTranslations("UnitConverter");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<UnitConverterLabels>(
    () => ({
      categoryLabel: t("categoryLabel"),
      categoryWeight: t("categoryWeight"),
      categoryLength: t("categoryLength"),
      categoryArea: t("categoryArea"),
      inputLabel: t("inputLabel"),
      fromLabel: t("fromLabel"),
      toLabel: t("toLabel"),
      resultLabel: t("resultLabel"),
      resetButton: t("resetButton"),
      invalidInput: t("invalidInput"),
    }),
    [t],
  );

  return (
    <ToolLayout pageClassName="unit-converter-tool-page">
      <UnitConverter labels={labels} />
    </ToolLayout>
  );
}
