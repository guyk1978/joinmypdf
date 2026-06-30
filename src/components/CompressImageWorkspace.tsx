"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { CompressImage, type CompressImageLabels } from "@/components/CompressImage";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type CompressImageWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function CompressImageWorkspace({ tool, slug }: CompressImageWorkspaceProps) {
  const t = useTranslations("CompressImage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<CompressImageLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      compressInstructions: t("compressInstructions"),
      qualityLabel: t("qualityLabel"),
      formatQuality: (percent) => t("qualityValue", { percent }),
      originalSize: t("originalSize"),
      compressedSize: t("compressedSize"),
      estimatingSize: t("estimatingSize"),
      formatSavings: (percent) => t("savings", { percent }),
      compressAndDownload: t("compressAndDownload"),
      compressing: t("compressing"),
      invalidFile: t("invalidFile"),
      replaceImage: t("replaceImage"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page">
        <CompressImage labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
