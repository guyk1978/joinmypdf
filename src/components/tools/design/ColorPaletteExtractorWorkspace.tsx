"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  ColorPaletteExtractor,
  type ColorPaletteExtractorLabels,
} from "@/components/tools/design/ColorPaletteExtractor";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type ColorPaletteExtractorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ColorPaletteExtractorWorkspace({ tool, slug }: ColorPaletteExtractorWorkspaceProps) {
  const t = useTranslations("ColorPaletteExtractor");
  const tPage = useTranslations("ColorPaletteExtractorPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ColorPaletteExtractorLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      dashboardTitle: t("dashboardTitle"),
      emptyDashboard: t("emptyDashboard"),
      analyzing: t("analyzing"),
      colorCountLabel: t("colorCountLabel"),
      referenceLabel: t("referenceLabel"),
      swatchHex: t("swatchHex"),
      swatchRgb: t("swatchRgb"),
      copyHex: t("copyHex"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      replaceImage: t("replaceImage"),
      privacyLabel: t("privacyLabel"),
      invalidFile: t("invalidFile"),
      errorGeneric: t("errorGeneric"),
      dimensionsLabel: t("dimensionsLabel"),
      pageTitle: tPage("title"),
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell pageClassName="color-palette-extractor-tool-page">
      <ColorPaletteExtractor labels={labels} />
    </UtilityWorkspaceShell>
  );
}
