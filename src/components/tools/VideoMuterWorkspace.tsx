"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { VideoMuter, type VideoMuterLabels } from "@/components/tools/VideoMuter";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type VideoMuterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function VideoMuterWorkspace({ tool, slug }: VideoMuterWorkspaceProps) {
  const t = useTranslations("VideoMuter");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<VideoMuterLabels>(
    () => ({
      chooseFiles: t("chooseFiles"),
      fromDevice: t("fromDevice"),
      fromDropbox: t("fromDropbox"),
      fromGoogleDrive: t("fromGoogleDrive"),
      fromOneDrive: t("fromOneDrive"),
      orDropFilesHere: t.has("orDropFilesHere") ? t("orDropFilesHere") : "or drop files here",
      // Keep a literal `{provider}` token for ChooseFilesDropzone to fill in at toast time.
      cloudHint: t("cloudHint", { provider: "{provider}" }),
      privacyBadge: t("privacyBadge"),
      invalidFile: t("invalidFile"),
      instructions: t("instructions"),
      muteAndDownload: t("muteAndDownload"),
      muting: t("muting"),
      statusProcessing: t("statusProcessing"),
      statusSuccess: t("statusSuccess", { size: "{size}" }),
      downloadMuted: t("downloadMuted"),
      processAnother: t("processAnother"),
      tryAgain: t("tryAgain"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge={false}>
      <div id={WORKSPACE_OPERATIONS_ID} className="video-muter-tool-page">
        <VideoMuter
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
