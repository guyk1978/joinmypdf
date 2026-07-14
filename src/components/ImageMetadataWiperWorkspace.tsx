"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  ImageMetadataWiper,
  type ImageMetadataWiperLabels,
} from "@/components/ImageMetadataWiper";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type ImageMetadataWiperWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ImageMetadataWiperWorkspace({ tool, slug }: ImageMetadataWiperWorkspaceProps) {
  const t = useTranslations("ImageMetadataWiper");
  const tPage = useTranslations("ImageMetadataWiperPage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ImageMetadataWiperLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      selectLabel: t("selectLabel"),
      dropHint: t("dropHint"),
      privacyLabel: t("privacyLabel"),
      findingsTitle: t("findingsTitle"),
      noMetadata: t("noMetadata"),
      wiping: t("wiping"),
      inspecting: t("inspecting"),
      wipeButton: t("wipeButton"),
      clearButton: t("clearButton"),
      errorUnsupported: t("errorUnsupported"),
      errorEmpty: t("errorEmpty"),
      errorGeneric: t("errorGeneric"),
      successHint: t("successHint"),
      pageTitle: tPage("title"),
      findingLabels: {
        gps: t("findings.gps"),
        device: t("findings.device"),
        datetime: t("findings.datetime"),
        software: t("findings.software"),
        author: t("findings.author"),
        copyright: t("findings.copyright"),
        orientation: t("findings.orientation"),
        generic: t("findings.generic"),
      },
    }),
    [t, tPage],
  );

  return (
    <UtilityWorkspaceShell pageClassName="image-wiper-tool-page">
      <ImageMetadataWiper labels={labels} />
    </UtilityWorkspaceShell>
  );
}
