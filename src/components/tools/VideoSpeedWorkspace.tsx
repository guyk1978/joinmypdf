"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { VideoSpeed, type VideoSpeedLabels } from "@/components/tools/VideoSpeed";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type VideoSpeedWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function VideoSpeedWorkspace({ tool, slug }: VideoSpeedWorkspaceProps) {
  const t = useTranslations("VideoSpeed");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<VideoSpeedLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropTitleBusy: t("dropTitleBusy"),
      dropDescription: t("dropDescription"),
      privacyBadge: t("privacyBadge"),
      formatsHint: t("formatsHint"),
      selectLabel: t("selectLabel"),
      invalidFile: t("invalidFile"),
      instructions: t("instructions"),
      reencodeNotice: t("reencodeNotice"),
      speedLabel: t("speedLabel"),
      applyAndDownload: t("applyAndDownload"),
      processing: t("processing"),
      statusLoading: t("statusLoading"),
      statusProcessing: t("statusProcessing"),
      statusSuccess: t("statusSuccess"),
      downloadResult: t("downloadResult"),
      processAnother: t("processAnother"),
      tryAgain: t("tryAgain"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="video-speed-tool-page">
        <VideoSpeed
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
