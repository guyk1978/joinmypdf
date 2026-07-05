"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { SvgToFavicon, type SvgToFaviconLabels } from "@/components/SvgToFavicon";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type SvgToFaviconWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function SvgToFaviconWorkspace({ tool, slug }: SvgToFaviconWorkspaceProps) {
  const t = useTranslations("SvgToFavicon");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<SvgToFaviconLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      convertInstructions: t("convertInstructions"),
      formatFileInfo: (name) => t("fileInfo", { name }),
      previewLabel: t("previewLabel"),
      sizePreviewTitle: t("sizePreviewTitle"),
      sizePreviewHint: t("sizePreviewHint"),
      sizePreviewSize: (size) => t("sizePreviewSize", { size }),
      smartScalingActive: t("smartScalingActive"),
      mobilePreviewTitle: t("mobilePreviewTitle"),
      mobilePreviewHint: t("mobilePreviewHint"),
      desktopTabLabel: t("desktopTabLabel"),
      iosTabSwitcherLabel: t("iosTabSwitcherLabel"),
      androidTabSwitcherLabel: t("androidTabSwitcherLabel"),
      defaultSiteTitle: t("defaultSiteTitle"),
      inactiveTabLabel: t("inactiveTabLabel"),
      contrastTitle: t("contrastTitle"),
      contrastHint: t("contrastHint"),
      contrastChecking: t("contrastChecking"),
      contrastPass: (ratio) => t("contrastPass", { ratio }),
      contrastWarning: (ratio) => t("contrastWarning", { ratio }),
      contrastInvalid: t("contrastInvalid"),
      headerCodeTitle: t("headerCodeTitle"),
      headerCodeHint: t("headerCodeHint"),
      copyHtmlCode: t("copyHtmlCode"),
      copiedHtmlCode: t("copiedHtmlCode"),
      copyHtmlCodeFailed: t("copyHtmlCodeFailed"),
      privacyProcessing: t("privacyProcessing"),
      privacyComplete: t("privacyComplete"),
      downloadFavicon: t("downloadFavicon"),
      converting: t("converting"),
      convertingProgress: t("convertingProgress"),
      invalidFile: t("invalidFile"),
      convertFailed: t("convertFailed"),
      replaceFile: t("replaceFile"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page svg-to-favicon-tool-page">
        <SvgToFavicon labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
