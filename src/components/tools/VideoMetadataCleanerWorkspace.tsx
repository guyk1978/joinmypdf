"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  VideoMetadataCleaner,
  type VideoMetadataCleanerLabels,
} from "@/components/tools/VideoMetadataCleaner";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type VideoMetadataCleanerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function VideoMetadataCleanerWorkspace({ tool, slug }: VideoMetadataCleanerWorkspaceProps) {
  const t = useTranslations("VideoMetadataCleaner");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<VideoMetadataCleanerLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropTitleBusy: t("dropTitleBusy"),
      dropDescription: t("dropDescription"),
      privacyBadge: t("privacyBadge"),
      formatsHint: t("formatsHint"),
      selectLabel: t("selectLabel"),
      invalidFile: t("invalidFile"),
      instructions: t("instructions"),
      previewTitle: t("previewTitle"),
      previewEmpty: t("previewEmpty"),
      previewScanning: t("previewScanning"),
      sensitiveBadge: t("sensitiveBadge"),
      cleanAndDownload: t("cleanAndDownload"),
      cleaning: t("cleaning"),
      statusProcessing: t("statusProcessing"),
      statusSuccess: t("statusSuccess"),
      summaryTitle: t("summaryTitle"),
      summaryBody: t("summaryBody"),
      summaryFieldsRemoved: t("summaryFieldsRemoved"),
      downloadCleaned: t("downloadCleaned"),
      processAnother: t("processAnother"),
      tryAgain: t("tryAgain"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="video-metadata-cleaner-tool-page">
        <VideoMetadataCleaner
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
