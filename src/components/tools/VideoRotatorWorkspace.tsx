"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { VideoRotator, type VideoRotatorLabels } from "@/components/tools/VideoRotator";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type VideoRotatorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function VideoRotatorWorkspace({ tool, slug }: VideoRotatorWorkspaceProps) {
  const t = useTranslations("VideoRotator");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<VideoRotatorLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropTitleBusy: t("dropTitleBusy"),
      dropDescription: t("dropDescription"),
      privacyBadge: t("privacyBadge"),
      formatsHint: t("formatsHint"),
      selectLabel: t("selectLabel"),
      invalidFile: t("invalidFile"),
      instructions: t("instructions"),
      previewLabel: t("previewLabel"),
      resultPreviewLabel: t("resultPreviewLabel"),
      rotationLabel: t("rotationLabel"),
      rotate90: t("rotate90"),
      rotate180: t("rotate180"),
      rotate270: t("rotate270"),
      methodLabel: t("methodLabel"),
      methodMetadata: t("methodMetadata"),
      methodMetadataHint: t("methodMetadataHint"),
      methodReencode: t("methodReencode"),
      methodReencodeHint: t("methodReencodeHint"),
      rotateAndDownload: t("rotateAndDownload"),
      rotating: t("rotating"),
      statusLoading: t("statusLoading"),
      statusProcessingMetadata: t("statusProcessingMetadata"),
      statusProcessingReencode: t("statusProcessingReencode"),
      statusSuccess: t("statusSuccess"),
      statusSuccessFallback: t("statusSuccessFallback"),
      downloadRotated: t("downloadRotated"),
      rotateAnother: t("rotateAnother"),
      tryAgain: t("tryAgain"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="video-rotator-tool-page">
        <VideoRotator
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
