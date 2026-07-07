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
      resolutionLabel: t("resolutionLabel"),
      resolution480: t("resolution480"),
      resolution720: t("resolution720"),
      resolution1080: t("resolution1080"),
      resizeAndDownload: t("resizeAndDownload"),
      resizing: t("resizing"),
      statusLoading: t("statusLoading"),
      statusProcessing: t("statusProcessing"),
      statusSuccess: t("statusSuccess"),
      statusError: t("statusError"),
      resizeAnother: t("resizeAnother"),
      tryAgain: t("tryAgain"),
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
