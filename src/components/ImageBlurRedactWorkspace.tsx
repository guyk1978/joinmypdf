"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  ImageBlurRedact,
  type ImageBlurRedactLabels,
} from "@/components/ImageBlurRedact";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type ImageBlurRedactWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ImageBlurRedactWorkspace({ tool, slug }: ImageBlurRedactWorkspaceProps) {
  const t = useTranslations("ImageBlurRedact");
  const tPage = useTranslations("ImageBlurRedactPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ImageBlurRedactLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      instructions: t("instructions"),
      modeBlur: t("modeBlur"),
      modePixelate: t("modePixelate"),
      modeSolid: t("modeSolid"),
      intensityLabel: t("intensityLabel"),
      applyRegion: t("applyRegion"),
      cancelSelection: t("cancelSelection"),
      undo: t("undo"),
      clearAll: t("clearAll"),
      replaceImage: t("replaceImage"),
      processDownload: t("processDownload"),
      processing: t("processing"),
      autoDetectFaces: t("autoDetectFaces"),
      autoDetectBusy: t("autoDetectBusy"),
      autoDetectUnsupported: t("autoDetectUnsupported"),
      autoDetectNone: t("autoDetectNone"),
      autoDetectDone: t("autoDetectDone"),
      privacyLabel: t("privacyLabel"),
      regionsCount: t("regionsCount"),
      invalidFile: t("invalidFile"),
      errorEmptySelection: t("errorEmptySelection"),
      errorGeneric: t("errorGeneric"),
      pageTitle: tPage("title"),
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell pageClassName="image-blur-redact-tool-page">
      <ImageBlurRedact labels={labels} />
    </UtilityWorkspaceShell>
  );
}
