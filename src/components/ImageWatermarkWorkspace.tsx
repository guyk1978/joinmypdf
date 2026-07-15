"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ImageWatermark, type ImageWatermarkLabels } from "@/components/ImageWatermark";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { WatermarkPosition } from "@/lib/image-watermark";
import type { ToolDefinition } from "@/lib/types";

type ImageWatermarkWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

const POSITION_KEYS: WatermarkPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

export function ImageWatermarkWorkspace({ tool, slug }: ImageWatermarkWorkspaceProps) {
  const t = useTranslations("ImageWatermark");
  const tPage = useTranslations("ImageWatermarkPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ImageWatermarkLabels>(() => {
    const positionLabels = {} as Record<WatermarkPosition, string>;
    for (const key of POSITION_KEYS) {
      positionLabels[key] = t(`positions.${key}`);
    }

    return {
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      sidebarTitle: t("sidebarTitle"),
      typeTitle: t("typeTitle"),
      typeText: t("typeText"),
      typeLogo: t("typeLogo"),
      textLabel: t("textLabel"),
      textPlaceholder: t("textPlaceholder"),
      fontLabel: t("fontLabel"),
      colorLabel: t("colorLabel"),
      opacityLabel: t("opacityLabel"),
      sizeLabel: t("sizeLabel"),
      logoLabel: t("logoLabel"),
      logoHint: t("logoHint"),
      logoSelect: t("logoSelect"),
      autoScaleLogo: t("autoScaleLogo"),
      logoScaleLabel: t("logoScaleLabel"),
      positionTitle: t("positionTitle"),
      offsetXLabel: t("offsetXLabel"),
      offsetYLabel: t("offsetYLabel"),
      previewTitle: t("previewTitle"),
      batchHint: t("batchHint"),
      activeImageLabel: t("activeImageLabel"),
      applyDownload: t("applyDownload"),
      applying: t("applying"),
      replaceImages: t("replaceImages"),
      removeLogo: t("removeLogo"),
      privacyLabel: t("privacyLabel"),
      invalidFile: t("invalidFile"),
      invalidLogo: t("invalidLogo"),
      errorEmptyText: t("errorEmptyText"),
      errorNoLogo: t("errorNoLogo"),
      errorGeneric: t("errorGeneric"),
      positionLabels,
      pageTitle: tPage("title"),
    };
  }, [t, tPage]);

  return (
    <UtilityWorkspaceShell pageClassName="image-watermark-tool-page">
      <ImageWatermark labels={labels} />
    </UtilityWorkspaceShell>
  );
}
