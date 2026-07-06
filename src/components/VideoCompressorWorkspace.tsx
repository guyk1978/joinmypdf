"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { VideoCompressor, type VideoCompressorLabels } from "@/components/VideoCompressor";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type VideoCompressorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function VideoCompressorWorkspace({ tool, slug }: VideoCompressorWorkspaceProps) {
  const t = useTranslations("VideoCompressor");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<VideoCompressorLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropTitleBusy: t("dropTitleBusy"),
      dropDescription: t("dropDescription"),
      privacyBadge: t("privacyBadge"),
      formatsHint: t("formatsHint"),
      selectLabel: t("selectLabel"),
      invalidFile: t("invalidFile"),
      compressInstructions: t("compressInstructions"),
      qualityLabel: t("qualityLabel"),
      compressionLow: t("compressionLow"),
      compressionMedium: t("compressionMedium"),
      compressionHigh: t("compressionHigh"),
      compressAndDownload: t("compressAndDownload"),
      compressing: t("compressing"),
      statusLoading: t("statusLoading"),
      statusProcessing: t("statusProcessing"),
      statusSuccess: t("statusSuccess"),
      statusError: t("statusError"),
      compressAnother: t("compressAnother"),
      tryAgain: t("tryAgain"),
      sizeCompare: {
        originalSize: t("originalSize"),
        compressedSize: t("compressedSize"),
        pendingSize: t("pendingSize"),
        formatSavings: (percent) => t("formatSavings", { percent }),
        bytesSaved: (saved, bytes) => t("bytesSaved", { saved, bytes }),
      },
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="video-compressor-tool-page">
        <VideoCompressor
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
