"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FaviconGenerator, type FaviconGeneratorLabels } from "@/components/FaviconGenerator";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type FaviconGeneratorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function FaviconGeneratorWorkspace({ tool, slug }: FaviconGeneratorWorkspaceProps) {
  const t = useTranslations("FaviconGenerator");
  const tPage = useTranslations("FaviconGeneratorPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<FaviconGeneratorLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      settingsTitle: t("settingsTitle"),
      previewTitle: t("previewTitle"),
      tabPreviewLabel: t("tabPreviewLabel"),
      sizesTitle: t("sizesTitle"),
      sizeHint: t("sizeHint"),
      outputTitle: t("outputTitle"),
      outputIco: t("outputIco"),
      outputIcoHint: t("outputIcoHint"),
      outputPng: t("outputPng"),
      outputPngHint: t("outputPngHint"),
      letterboxLabel: t("letterboxLabel"),
      letterboxHint: t("letterboxHint"),
      generateDownload: t("generateDownload"),
      generating: t("generating"),
      replaceImage: t("replaceImage"),
      privacyLabel: t("privacyLabel"),
      invalidFile: t("invalidFile"),
      errorGeneric: t("errorGeneric"),
      successHint: t("successHint"),
      siteTitleLabel: t("siteTitleLabel"),
      siteTitlePlaceholder: t("siteTitlePlaceholder"),
      defaultSiteTitle: t("defaultSiteTitle"),
      headerCodeTitle: t("headerCodeTitle"),
      headerCodeHint: t("headerCodeHint"),
      copyHeaderCode: t("copyHeaderCode"),
      copiedHeaderCode: t("copiedHeaderCode"),
      copyFailed: t("copyFailed"),
      pageTitle: tPage("title"),
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell pageClassName="favicon-generator-tool-page">
      <FaviconGenerator labels={labels} />
    </UtilityWorkspaceShell>
  );
}
