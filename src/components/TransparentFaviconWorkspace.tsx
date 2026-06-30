"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { TransparentFavicon, type TransparentFaviconLabels } from "@/components/TransparentFavicon";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type TransparentFaviconWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function TransparentFaviconWorkspace({ tool, slug }: TransparentFaviconWorkspaceProps) {
  const t = useTranslations("TransparentFavicon");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<TransparentFaviconLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      pickInstructions: t("pickInstructions"),
      formatPickedColor: (color) => t("pickedColor", { color }),
      downloadTransparent: t("downloadTransparent"),
      exporting: t("exporting"),
      invalidFile: t("invalidFile"),
      exportFailed: t("exportFailed"),
      replaceImage: t("replaceImage"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page transparent-favicon-tool-page">
        <TransparentFavicon labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
