"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { VideoResizer, type VideoResizerLabels } from "@/components/tools/VideoResizer";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type VideoResizerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function VideoResizerWorkspace({ tool, slug }: VideoResizerWorkspaceProps) {
  const t = useTranslations("VideoResizer");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<VideoResizerLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropTitleBusy: t("dropTitleBusy"),
      dropDescription: t("dropDescription"),
      privacyBadge: t("privacyBadge"),
      formatsHint: t("formatsHint"),
      selectLabel: t("selectLabel"),
      invalidFile: t("invalidFile"),
      instructions: t("instructions"),
      presetsLabel: t("presetsLabel"),
      preset916: t("preset916"),
      preset11: t("preset11"),
      preset169: t("preset169"),
      customLabel: t("customLabel"),
      widthLabel: t("widthLabel"),
      heightLabel: t("heightLabel"),
      sourceSizeLabel: t("sourceSizeLabel"),
      cropPreviewLabel: t("cropPreviewLabel"),
      cropPreviewHint: t("cropPreviewHint"),
      outputSizeLabel: t("outputSizeLabel"),
      resizeAndDownload: t("resizeAndDownload"),
      resizing: t("resizing"),
      statusProcessing: t("statusProcessing"),
      statusSuccess: t("statusSuccess"),
      resizeAnother: t("resizeAnother"),
      tryAgain: t("tryAgain"),
      downloadAgain: t("downloadAgain"),
      dimensionsError: t("dimensionsError"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="video-resizer-tool-page">
        <VideoResizer
          labels={labels}
          onStart={() => {
            capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
          }}
          onComplete={() => {
            capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
            window.setTimeout(() => {
              dispatchToolComplete({ operation: tool.operation, slug });
            }, 400);
          }}
        />
      </div>
    </WorkspaceUploadShell>
  );
}
