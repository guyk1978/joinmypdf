"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
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

  const labels = useMemo<UnitConverterLabels>(() => {
    const unitIds = [
      "kg",
      "g",
      "lb",
      "oz",
      "m",
      "km",
      "cm",
      "mm",
      "ft",
      "in",
      "mi",
      "m2",
      "km2",
      "ft2",
      "acre",
      "hectare",
    ] as const;
    const unitLabels: Record<string, string> = {};
    for (const id of unitIds) {
      const key = `units.${id}`;
      if (t.has(key)) unitLabels[id] = t(key);
    }
    return {
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
      unitLabels: Object.keys(unitLabels).length ? unitLabels : undefined,
    };
  }, [t]);

  return (
    <UtilityWorkspaceShell pageClassName="unit-converter-tool-page">
      <UnitConverter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
