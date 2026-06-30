"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FaviconCompressor, type FaviconCompressorLabels } from "@/components/FaviconCompressor";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type FaviconCompressorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function FaviconCompressorWorkspace({ tool, slug }: FaviconCompressorWorkspaceProps) {
  const t = useTranslations("FaviconCompressor");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<FaviconCompressorLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      compressInstructions: t("compressInstructions"),
      formatFileInfo: (name, width, height) => t("fileInfo", { name, width, height }),
      formatIcoFileInfo: (name, frameCount) => t("icoFileInfo", { name, frameCount }),
      originalSize: t("originalSize"),
      compressedSize: t("compressedSize"),
      estimatingSize: t("estimatingSize"),
      formatSavings: (percent) => t("formatSavings", { percent }),
      downloadOptimized: t("downloadOptimized"),
      optimizing: t("optimizing"),
      optimizingProgress: t("optimizingProgress"),
      invalidFile: t("invalidFile"),
      optimizeFailed: t("optimizeFailed"),
      replaceFile: t("replaceFile"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page favicon-compressor-tool-page">
        <FaviconCompressor labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
