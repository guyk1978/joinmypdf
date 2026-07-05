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
      brandColorLabel: t("brandColorLabel"),
      brandColorHint: t("brandColorHint"),
      harmonyButton: t("harmonyButton"),
      harmonyButtonAria: (index, total) => t("harmonyButtonAria", { index, total }),
      backgroundColorLabel: t("backgroundColorLabel"),
      textColorLabel: t("textColorLabel"),
      previewLabel: t("previewLabel"),
      previewSize: (size) => t("previewSize", { size }),
      formatLabel: t("formatLabel"),
      formatPng: t("formatPng"),
      formatIco: t("formatIco"),
      download: t("download"),
      downloadIco: t("downloadIco"),
      downloadPng: t("downloadPng"),
      exportIcoHint: t("exportIcoHint"),
      downloading: t("downloading"),
      emptyTextError: t("emptyTextError"),
      mobilePreviewTitle: t("mobilePreviewTitle"),
      desktopTabLabel: t("desktopTabLabel"),
      iosTabSwitcherLabel: t("iosTabSwitcherLabel"),
      androidTabSwitcherLabel: t("androidTabSwitcherLabel"),
      defaultSiteTitle: t("defaultSiteTitle"),
      inactiveTabLabel: t("inactiveTabLabel"),
      contrastLabel: t("contrastLabel"),
      contrastPass: (ratio) => t("contrastPass", { ratio }),
      contrastWarning: (ratio) => t("contrastWarning", { ratio }),
      contrastInvalid: t("contrastInvalid"),
      headerCodeTitle: t("headerCodeTitle"),
      headerCodeHint: t("headerCodeHint"),
      iconPathLabel: t("iconPathLabel"),
      iconPathPlaceholder: t("iconPathPlaceholder"),
      copyHeaderCode: t("copyHeaderCode"),
      copiedHeaderCode: t("copiedHeaderCode"),
      copyHeaderCodeFailed: t("copyHeaderCodeFailed"),
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
