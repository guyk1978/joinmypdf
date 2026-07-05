"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { AppleTouchIcon, type AppleTouchIconLabels } from "@/components/AppleTouchIcon";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type AppleTouchIconWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function AppleTouchIconWorkspace({ tool, slug }: AppleTouchIconWorkspaceProps) {
  const t = useTranslations("AppleTouchIcon");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<AppleTouchIconLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      convertInstructions: t("convertInstructions"),
      formatFileInfo: (name, width, height) => t("fileInfo", { name, width, height }),
      sizesLabel: t("sizesLabel"),
      formatSizeOption: (key) => t(`sizes.${key}` as "sizes.size180"),
      backgroundLabel: t("backgroundLabel"),
      transparentBackground: t("transparentBackground"),
      iosPreview: {
        title: t("iosPreviewLabel"),
        hint: t("iosHomeScreenPreviewHint"),
        defaultSiteTitle: t("defaultSiteTitle"),
        safeZoneToggleLabel: t("safeZoneToggleLabel"),
        safeZoneToggleAria: t("safeZoneToggleAria"),
        safeZoneFlatPreviewLabel: t("safeZoneFlatPreviewLabel"),
      },
      downloadAppleIcon: t("downloadAppleIcon"),
      generating: t("generating"),
      generatingProgress: t("generatingProgress"),
      invalidFile: t("invalidFile"),
      convertFailed: t("convertFailed"),
      replaceImage: t("replaceImage"),
      privacyShieldMessage: t("privacyShieldMessage"),
      retinaQuality: {
        retinaTitle: t("retinaTitle"),
        retinaHint: t("retinaHint"),
        retinaPass: (supersample) => t("retinaPass", { supersample }),
        retinaWarning: (upscale, shortSide, recommended) =>
          t("retinaWarning", { upscale, shortSide, recommended }),
      },
      headerCode: {
        title: t("headerCodeTitle"),
        hint: t("headerCodeHint"),
        iconPathLabel: t("headerCodeIconPathLabel"),
        iconPathPlaceholder: t("headerCodeIconPathPlaceholder"),
        copyHtmlCode: t("copyHtmlCode"),
        copiedHtmlCode: t("copiedHtmlCode"),
        copyHtmlCodeFailed: t("copyHtmlCodeFailed"),
      },
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page apple-touch-icon-tool-page">
        <AppleTouchIcon labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
