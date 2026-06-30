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
      sizeLabel: t("sizeLabel"),
      formatSizeOption: (size) => t("sizeOption", { size }),
      previewLabel: t("previewLabel"),
      previewFaviconLabel: t("previewFaviconLabel"),
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
