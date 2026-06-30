"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { CropImage, type CropImageLabels } from "@/components/CropImage";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type CropImageWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function CropImageWorkspace({ tool, slug }: CropImageWorkspaceProps) {
  const t = useTranslations("CropImage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<CropImageLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      cropAndDownload: t("cropAndDownload"),
      cropping: t("cropping"),
      cropInstructions: t("cropInstructions"),
      invalidFile: t("invalidFile"),
      replaceImage: t("replaceImage"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page">
        <CropImage labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
