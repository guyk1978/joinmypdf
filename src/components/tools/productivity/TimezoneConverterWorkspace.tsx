"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import {
  TimezoneConverter,
  type TimezoneConverterLabels,
} from "@/components/tools/productivity/TimezoneConverter";

type TimezoneConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function TimezoneConverterWorkspace({ tool, slug }: TimezoneConverterWorkspaceProps) {
  const t = useTranslations("TimezoneConverter");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<TimezoneConverterLabels>(
    () => ({
      localTitle: t("localTitle"),
      citiesTitle: t("citiesTitle"),
      addCityLabel: t("addCityLabel"),
      addCityButton: t("addCityButton"),
      removeCity: t("removeCity"),
      resetButton: t("resetButton"),
      localZoneFallback: t("localZoneFallback"),
      utc: t("utc"),
      newYork: t("newYork"),
      losAngeles: t("losAngeles"),
      london: t("london"),
      paris: t("paris"),
      dubai: t("dubai"),
      tokyo: t("tokyo"),
      sydney: t("sydney"),
      jerusalem: t("jerusalem"),
      singapore: t("singapore"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="timezone-tool-page">
      <TimezoneConverter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
