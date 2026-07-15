"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ImageGridSplitter, type ImageGridSplitterLabels } from "@/components/ImageGridSplitter";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type ImageGridSplitterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ImageGridSplitterWorkspace({ tool, slug }: ImageGridSplitterWorkspaceProps) {
  const t = useTranslations("ImageGridSplitter");
  const tPage = useTranslations("ImageGridSplitterPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ImageGridSplitterLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      settingsTitle: t("settingsTitle"),
      presetsTitle: t("presetsTitle"),
      customTitle: t("customTitle"),
      rowsLabel: t("rowsLabel"),
      colsLabel: t("colsLabel"),
      previewTitle: t("previewTitle"),
      dimensionsLabel: t("dimensionsLabel"),
      gridSummary: t("gridSummary"),
      sliceDownload: t("sliceDownload"),
      slicing: t("slicing"),
      replaceImage: t("replaceImage"),
      privacyLabel: t("privacyLabel"),
      invalidFile: t("invalidFile"),
      errorGeneric: t("errorGeneric"),
      errorTooSmall: t("errorTooSmall"),
      successHint: t("successHint"),
      pageTitle: tPage("title"),
      presetLabels: {
        "2x2": t("presets.2x2"),
        "3x3": t("presets.3x3"),
        "1x3": t("presets.1x3"),
        "3x1": t("presets.3x1"),
        custom: t("presets.custom"),
      },
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell pageClassName="image-grid-splitter-tool-page">
      <ImageGridSplitter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
