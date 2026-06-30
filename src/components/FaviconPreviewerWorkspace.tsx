"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FaviconPreviewer, type FaviconPreviewerLabels } from "@/components/FaviconPreviewer";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type FaviconPreviewerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function FaviconPreviewerWorkspace({ tool, slug }: FaviconPreviewerWorkspaceProps) {
  const t = useTranslations("FaviconPreviewer");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<FaviconPreviewerLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      orUseUrl: t("orUseUrl"),
      urlLabel: t("urlLabel"),
      urlPlaceholder: t("urlPlaceholder"),
      applyUrl: t("applyUrl"),
      titleLabel: t("titleLabel"),
      titlePlaceholder: t("titlePlaceholder"),
      uiThemeLabel: t("uiThemeLabel"),
      themeLight: t("themeLight"),
      themeDark: t("themeDark"),
      previewInstructions: t("previewInstructions"),
      browserTabLabel: t("browserTabLabel"),
      bookmarksLabel: t("bookmarksLabel"),
      homeScreenLabel: t("homeScreenLabel"),
      bookmarkOtherSite: t("bookmarkOtherSite"),
      invalidFile: t("invalidFile"),
      invalidUrl: t("invalidUrl"),
      replaceFavicon: t("replaceFavicon"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="favicon-previewer-tool-page">
        <FaviconPreviewer labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
