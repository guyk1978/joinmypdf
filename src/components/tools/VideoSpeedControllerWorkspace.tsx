"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  VideoSpeedController,
  type VideoSpeedControllerLabels,
} from "@/components/tools/VideoSpeedController";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type VideoSpeedControllerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function VideoSpeedControllerWorkspace({ tool, slug }: VideoSpeedControllerWorkspaceProps) {
  const t = useTranslations("VideoSpeedController");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<VideoSpeedControllerLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropTitleBusy: t("dropTitleBusy"),
      dropDescription: t("dropDescription"),
      privacyBadge: t("privacyBadge"),
      formatsHint: t("formatsHint"),
      selectLabel: t("selectLabel"),
      invalidFile: t("invalidFile"),
      instructions: t("instructions"),
      speedLabel: t("speedLabel"),
      speedSlow: t("speedSlow"),
      speedNormal: t("speedNormal"),
      speedFast: t("speedFast"),
      applyAndDownload: t("applyAndDownload"),
      processing: t("processing"),
      statusLoading: t("statusLoading"),
      statusProcessing: t("statusProcessing"),
      statusSuccess: t("statusSuccess"),
      statusError: t("statusError"),
      processAnother: t("processAnother"),
      tryAgain: t("tryAgain"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="video-speed-controller-tool-page">
        <VideoSpeedController
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
