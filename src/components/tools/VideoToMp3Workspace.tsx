"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { VideoToMp3, type VideoToMp3Labels } from "@/components/tools/VideoToMp3";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type VideoToMp3WorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function VideoToMp3Workspace({ tool, slug }: VideoToMp3WorkspaceProps) {
  const t = useTranslations("VideoToMp3");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<VideoToMp3Labels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropTitleBusy: t("dropTitleBusy"),
      dropDescription: t("dropDescription"),
      privacyBadge: t("privacyBadge"),
      formatsHint: t("formatsHint"),
      selectLabel: t("selectLabel"),
      invalidFile: t("invalidFile"),
      instructions: t("instructions"),
      qualityLabel: t("qualityLabel"),
      qualityHint: t("qualityHint"),
      qualityVbr: t("qualityVbr"),
      quality128: t("quality128"),
      quality192: t("quality192"),
      quality320: t("quality320"),
      extractAndDownload: t("extractAndDownload"),
      extracting: t("extracting"),
      statusProcessing: t("statusProcessing"),
      statusSuccess: t("statusSuccess"),
      downloadMp3: t("downloadMp3"),
      convertAnother: t("convertAnother"),
      tryAgain: t("tryAgain"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="video-to-mp3-tool-page">
        <VideoToMp3
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
