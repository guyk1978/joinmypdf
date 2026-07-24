"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { PngToIco, type PngToIcoLabels } from "@/components/PngToIco";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type PngToIcoWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function PngToIcoWorkspace({ tool, slug }: PngToIcoWorkspaceProps) {
  const t = useTranslations("PngToIco");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<PngToIcoLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      convertInstructions: t("convertInstructions"),
      batchInstructions: t("batchInstructions"),
      batchFileCount: (count) => t("batchFileCount", { count }),
      batchStatusPending: t("batchStatusPending"),
      batchStatusProcessing: t("batchStatusProcessing"),
      batchStatusDone: t("batchStatusDone"),
      batchStatusError: t("batchStatusError"),
      batchProgress: (current, total) => t("batchProgress", { current, total }),
      downloadAll: t("downloadAll"),
      formatFileInfo: (name, width, height) => t("fileInfo", { name, width, height }),
      sizePreviewTitle: t("sizePreviewTitle"),
      sizePreviewHint: t("sizePreviewHint"),
      sizePreviewSize: (size) => t("sizePreviewSize", { size }),
      downloadIco: t("downloadIco"),
      converting: t("converting"),
      convertingProgress: t("convertingProgress"),
      invalidFile: t("invalidFile"),
      convertFailed: t("convertFailed"),
      replaceImage: t("replaceImage"),
      clearBatch: t("clearBatch"),
      invalidBatchFiles: (count) => t("invalidBatchFiles", { count }),
      maintainAspectRatioWithPadding: t("maintainAspectRatioWithPadding"),
      maintainAspectRatioWithPaddingHint: t("maintainAspectRatioWithPaddingHint"),
      localProcessingActive: t("localProcessingActive"),
      localProcessingComplete: t("localProcessingComplete"),
      headerCodeTitle: t("headerCodeTitle"),
      headerCodeHint: t("headerCodeHint"),
      iconPathLabel: t("iconPathLabel"),
      iconPathPlaceholder: t("iconPathPlaceholder"),
      copyHtmlCode: t("copyHtmlCode"),
      copiedHtmlCode: t("copiedHtmlCode"),
      copyHtmlCodeFailed: t("copyHtmlCodeFailed"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page png-to-ico-tool-page">
        <PngToIco labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
