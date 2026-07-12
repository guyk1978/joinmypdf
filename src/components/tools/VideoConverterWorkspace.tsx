"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { VideoConverter, type VideoConverterLabels } from "@/components/tools/VideoConverter";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type VideoConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function VideoConverterWorkspace({ tool, slug }: VideoConverterWorkspaceProps) {
  const t = useTranslations("VideoConverter");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<VideoConverterLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropTitleBusy: t("dropTitleBusy"),
      dropDescription: t("dropDescription"),
      privacyBadge: t("privacyBadge"),
      formatsHint: t("formatsHint"),
      selectLabel: t("selectLabel"),
      invalidFile: t("invalidFile"),
      instructions: t("instructions"),
      targetFormatLabel: t("targetFormatLabel"),
      targetFormatHint: t("targetFormatHint"),
      formatMp4: t("formatMp4"),
      formatWebm: t("formatWebm"),
      formatMov: t("formatMov"),
      convertAndDownload: t("convertAndDownload"),
      converting: t("converting"),
      statusProcessing: t("statusProcessing"),
      statusSuccess: t("statusSuccess"),
      downloadConverted: t("downloadConverted"),
      convertAnother: t("convertAnother"),
      tryAgain: t("tryAgain"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="video-converter-tool-page">
        <VideoConverter
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
