"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  VideoTrimmer,
  type VideoTrimmerLabels,
} from "@/components/tools/VideoTrimmer";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type VideoTrimmerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function VideoTrimmerWorkspace({ tool, slug }: VideoTrimmerWorkspaceProps) {
  const t = useTranslations("VideoTrimmer");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<VideoTrimmerLabels>(
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
      startLabel: t("startLabel"),
      endLabel: t("endLabel"),
      durationLabel: t("durationLabel"),
      selectionLabel: t("selectionLabel"),
      processAndDownload: t("processAndDownload"),
      processing: t("processing"),
      statusProcessing: t("statusProcessing"),
      processAnother: t("processAnother"),
      tryAgain: t("tryAgain"),
      downloadAgain: t("downloadAgain"),
      successMessage: t("successMessage"),
      rangeError: t("rangeError"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="video-trimmer-tool-page">
        <VideoTrimmer
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
