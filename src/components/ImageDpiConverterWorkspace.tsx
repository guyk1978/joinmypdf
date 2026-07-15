"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ImageDpiConverter, type ImageDpiConverterLabels } from "@/components/ImageDpiConverter";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type ImageDpiConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ImageDpiConverterWorkspace({ tool, slug }: ImageDpiConverterWorkspaceProps) {
  const t = useTranslations("ImageDpiConverter");
  const tPage = useTranslations("ImageDpiConverterPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ImageDpiConverterLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      settingsTitle: t("settingsTitle"),
      currentDpiLabel: t("currentDpiLabel"),
      currentDpiUnknown: t("currentDpiUnknown"),
      dimensionsLabel: t("dimensionsLabel"),
      formatLabel: t("formatLabel"),
      formatJpeg: t("formatJpeg"),
      formatPng: t("formatPng"),
      targetDpiLabel: t("targetDpiLabel"),
      customDpiLabel: t("customDpiLabel"),
      presetAria: t("presetAria"),
      printReady: t("printReady"),
      printReadyHint: t("printReadyHint"),
      convertDownload: t("convertDownload"),
      converting: t("converting"),
      replaceImage: t("replaceImage"),
      privacyLabel: t("privacyLabel"),
      invalidFile: t("invalidFile"),
      invalidDpi: t("invalidDpi"),
      errorGeneric: t("errorGeneric"),
      successHint: t("successHint"),
      pageTitle: tPage("title"),
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell pageClassName="image-dpi-converter-tool-page">
      <ImageDpiConverter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
