"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { IcoToPng, type IcoToPngLabels } from "@/components/IcoToPng";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type IcoToPngWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function IcoToPngWorkspace({ tool, slug }: IcoToPngWorkspaceProps) {
  const t = useTranslations("IcoToPng");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<IcoToPngLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      convertInstructions: t("convertInstructions"),
      formatFileInfo: (name, frameCount) => t("fileInfo", { name, frameCount }),
      framesLabel: t("framesLabel"),
      formatFrameSize: (width, height, bitCount) => t("frameSize", { width, height, bitCount }),
      previewLabel: t("previewLabel"),
      downloadPng: t("downloadPng"),
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
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page ico-to-png-tool-page">
        <IcoToPng labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
