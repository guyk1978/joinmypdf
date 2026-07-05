"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FaviconCropper, type FaviconCropperLabels } from "@/components/FaviconCropper";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type FaviconCropperWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function FaviconCropperWorkspace({ tool, slug }: FaviconCropperWorkspaceProps) {
  const t = useTranslations("FaviconCropper");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<FaviconCropperLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      cropInstructions: t("cropInstructions"),
      outputSizeLabel: t("outputSizeLabel"),
      formatOutputSize: (key) => t(`outputSizes.${key}` as "outputSizes.native"),
      downloadCropped: t("downloadCropped"),
      cropping: t("cropping"),
      invalidFile: t("invalidFile"),
      replaceImage: t("replaceImage"),
      previewPanel: {
        title: t("previewPanelTitle"),
        hint: t("previewPanelHint"),
        updating: t("previewPanelUpdating"),
        formatSize: (size) => t("previewPanelSize", { size }),
      },
      privacyBadgeWaiting: t("privacyBadgeWaiting"),
      privacyBadgeLocal: t("privacyBadgeLocal"),
      focalPointLabel: t("focalPointLabel"),
      focalPointHint: t("focalPointHint"),
      focalPointCenter: t("focalPointCenter"),
      formatDetectedLabel: t("formatDetectedLabel"),
      formatLoadingHint: t("formatLoadingHint"),
      formatLabel: (format) => t(`formats.${format}` as "formats.png"),
      quickReset: t("quickReset"),
      quickResetHint: t("quickResetHint"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page favicon-cropper-tool-page">
        <FaviconCropper labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
