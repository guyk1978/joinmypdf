"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { RotateImage, type RotateImageLabels } from "@/components/RotateImage";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type RotateImageWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function RotateImageWorkspace({ tool, slug }: RotateImageWorkspaceProps) {
  const t = useTranslations("RotateImage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<RotateImageLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      rotateInstructions: t("rotateInstructions"),
      rotateLeft: t("rotateLeft"),
      rotateRight: t("rotateRight"),
      formatRotation: (degrees) => t("rotation", { degrees }),
      download: t("download"),
      downloading: t("downloading"),
      invalidFile: t("invalidFile"),
      replaceImage: t("replaceImage"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page">
        <RotateImage labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
