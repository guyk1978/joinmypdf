"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  StorageDataConverter,
  type StorageDataConverterLabels,
} from "@/components/tools/unit-math/StorageDataConverter";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type StorageDataConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function StorageDataConverterWorkspace({ tool, slug }: StorageDataConverterWorkspaceProps) {
  const t = useTranslations("StorageDataConverter");
  const tPage = useTranslations("StorageDataConverterPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<StorageDataConverterLabels>(
    () => ({
      valueLabel: t("valueLabel"),
      valuePlaceholder: t("valuePlaceholder"),
      fromLabel: t("fromLabel"),
      toLabel: t("toLabel"),
      swapLabel: t("swapLabel"),
      liveResultLabel: t("liveResultLabel"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      resetButton: t("resetButton"),
      emptyHint: t("emptyHint"),
      invalidInput: t("invalidInput"),
      privacyLabel: t("privacyLabel"),
      pageTitle: tPage("title"),
      scaleSiHint: t("scaleSiHint"),
      scaleIecHint: t("scaleIecHint"),
      B: t("B"),
      KB: t("KB"),
      MB: t("MB"),
      GB: t("GB"),
      TB: t("TB"),
      PB: t("PB"),
      KiB: t("KiB"),
      MiB: t("MiB"),
      GiB: t("GiB"),
      TiB: t("TiB"),
      PiB: t("PiB"),
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell pageClassName="storage-data-tool-page">
      <StorageDataConverter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
