"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { VideoToGif, type VideoToGifLabels } from "@/components/tools/VideoToGif";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type VideoToGifWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function VideoToGifWorkspace({ tool, slug }: VideoToGifWorkspaceProps) {
  const t = useTranslations("VideoToGif");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<VideoToGifLabels>(
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
      settingsLabel: t("settingsLabel"),
      startLabel: t("startLabel"),
      durationLabel: t("durationLabel"),
      fpsLabel: t("fpsLabel"),
      scaleLabel: t("scaleLabel"),
      scaleHint: t("scaleHint"),
      videoDurationLabel: t("videoDurationLabel"),
      createGif: t("createGif"),
      creating: t("creating"),
      statusProcessing: t("statusProcessing"),
      statusSuccess: t("statusSuccess"),
      convertAnother: t("convertAnother"),
      tryAgain: t("tryAgain"),
      downloadAgain: t("downloadAgain"),
      rangeError: t("rangeError"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="video-to-gif-tool-page">
        <VideoToGif
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
