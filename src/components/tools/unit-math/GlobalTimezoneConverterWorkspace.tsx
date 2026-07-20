"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  GlobalTimezoneConverter,
  type GlobalTimezoneConverterLabels,
} from "@/components/tools/unit-math/GlobalTimezoneConverter";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type GlobalTimezoneConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function GlobalTimezoneConverterWorkspace({
  tool,
  slug,
}: GlobalTimezoneConverterWorkspaceProps) {
  const t = useTranslations("GlobalTimezoneConverter");
  const tPage = useTranslations("GlobalTimezoneConverterPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<GlobalTimezoneConverterLabels>(
    () => ({
      sourceTitle: t("sourceTitle"),
      sourceTimeLabel: t("sourceTimeLabel"),
      sourceZoneLabel: t("sourceZoneLabel"),
      useLiveLabel: t("useLiveLabel"),
      targetsTitle: t("targetsTitle"),
      addZoneLabel: t("addZoneLabel"),
      addZoneButton: t("addZoneButton"),
      removeZone: t("removeZone"),
      resetButton: t("resetButton"),
      syncHint: t("syncHint"),
      meetingTitle: t("meetingTitle"),
      meetingHint: t("meetingHint"),
      copyMeetingLink: t("copyMeetingLink"),
      copiedMeetingLink: t("copiedMeetingLink"),
      copyFailed: t("copyFailed"),
      favoritesTitle: t("favoritesTitle"),
      saveFavorites: t("saveFavorites"),
      favoritesSaved: t("favoritesSaved"),
      loadFavorites: t("loadFavorites"),
      privacyLabel: t("privacyLabel"),
      pageTitle: tPage("title"),
      localZoneLabel: t("localZoneLabel"),
      utc: t("utc"),
      newYork: t("newYork"),
      losAngeles: t("losAngeles"),
      chicago: t("chicago"),
      london: t("london"),
      paris: t("paris"),
      berlin: t("berlin"),
      dubai: t("dubai"),
      mumbai: t("mumbai"),
      jerusalem: t("jerusalem"),
      singapore: t("singapore"),
      tokyo: t("tokyo"),
      sydney: t("sydney"),
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="global-tz-tool-page">
      <GlobalTimezoneConverter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
