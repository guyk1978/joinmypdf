"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { GenerateFavicon, type GenerateFaviconLabels } from "@/components/GenerateFavicon";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type GenerateFaviconWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function GenerateFaviconWorkspace({ tool, slug }: GenerateFaviconWorkspaceProps) {
  const t = useTranslations("GenerateFavicon");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<GenerateFaviconLabels>(
    () => ({
      instructions: t("instructions"),
      textLabel: t("textLabel"),
      textPlaceholder: t("textPlaceholder"),
      textHint: t("textHint"),
      backgroundColorLabel: t("backgroundColorLabel"),
      textColorLabel: t("textColorLabel"),
      previewLabel: t("previewLabel"),
      previewSize: (size) => t("previewSize", { size }),
      formatLabel: t("formatLabel"),
      formatPng: t("formatPng"),
      formatIco: t("formatIco"),
      download: t("download"),
      downloading: t("downloading"),
      emptyTextError: t("emptyTextError"),
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell showPrivacyBadge>
      <div id={WORKSPACE_OPERATIONS_ID} className="generate-favicon-tool-page">
        <GenerateFavicon labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
