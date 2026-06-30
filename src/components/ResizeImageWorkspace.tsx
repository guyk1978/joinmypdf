"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { ResizeImage, type ResizeImageLabels } from "@/components/ResizeImage";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type ResizeImageWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ResizeImageWorkspace({ tool, slug }: ResizeImageWorkspaceProps) {
  const t = useTranslations("ResizeImage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ResizeImageLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      resizeInstructions: t("resizeInstructions"),
      widthLabel: t("widthLabel"),
      heightLabel: t("heightLabel"),
      lockAspectRatio: t("lockAspectRatio"),
      formatOriginalSize: (width, height) => t("originalSize", { width, height }),
      resizeAndDownload: t("resizeAndDownload"),
      resizing: t("resizing"),
      invalidFile: t("invalidFile"),
      invalidDimensions: t("invalidDimensions"),
      replaceImage: t("replaceImage"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page">
        <ResizeImage labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
