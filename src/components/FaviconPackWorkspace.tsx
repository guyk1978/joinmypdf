"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FaviconPack, type FaviconPackLabels } from "@/components/FaviconPack";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type FaviconPackWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function FaviconPackWorkspace({ tool, slug }: FaviconPackWorkspaceProps) {
  const t = useTranslations("FaviconPack");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<FaviconPackLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      convertInstructions: t("convertInstructions"),
      formatFileInfo: (name, width, height) => t("fileInfo", { name, width, height }),
      includesLabel: t("includesLabel"),
      includesIco: t("includesIco"),
      sizeLabel: (key) => t(`sizes.${key}` as "sizes.size16"),
      downloadPack: t("downloadPack"),
      generating: t("generating"),
      generatingProgress: t("generatingProgress"),
      zippingProgress: t("zippingProgress"),
      invalidFile: t("invalidFile"),
      convertFailed: t("convertFailed"),
      replaceImage: t("replaceImage"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="crop-image-tool-page favicon-pack-tool-page">
        <FaviconPack labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
