"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import {
  ResponsiveDevicePreview,
  type ResponsiveDevicePreviewLabels,
} from "@/components/tools/developer/ResponsiveDevicePreview";

type ResponsiveDevicePreviewWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ResponsiveDevicePreviewWorkspace({
  tool,
  slug,
}: ResponsiveDevicePreviewWorkspaceProps) {
  const t = useTranslations("ResponsiveDevicePreview");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ResponsiveDevicePreviewLabels>(
    () => ({
      privacyLabel: t("privacyLabel"),
      sourceTitle: t("sourceTitle"),
      modePdf: t("modePdf"),
      modeUrl: t("modeUrl"),
      modeHtml: t("modeHtml"),
      pdfDropTitle: t("pdfDropTitle"),
      pdfDropHint: t("pdfDropHint"),
      pdfBrowse: t("pdfBrowse"),
      pdfClear: t("pdfClear"),
      pdfLoading: t("pdfLoading"),
      pdfError: t("pdfError"),
      pdfPageLabel: t("pdfPageLabel"),
      urlLabel: t("urlLabel"),
      urlPlaceholder: t("urlPlaceholder"),
      urlLoad: t("urlLoad"),
      urlHint: t("urlHint"),
      urlBlockedHint: t("urlBlockedHint"),
      urlLoading: t("urlLoading"),
      urlBlockedTitle: t("urlBlockedTitle"),
      urlBlockedBody: t("urlBlockedBody"),
      urlBlockedPolicy: t("urlBlockedPolicy"),
      urlTryHtml: t("urlTryHtml"),
      urlTryPdf: t("urlTryPdf"),
      urlOpenExternal: t("urlOpenExternal"),
      htmlLabel: t("htmlLabel"),
      htmlPlaceholder: t("htmlPlaceholder"),
      htmlApply: t("htmlApply"),
      htmlResetSample: t("htmlResetSample"),
      deviceTitle: t("deviceTitle"),
      phoneLabel: t("phoneLabel"),
      tabletLabel: t("tabletLabel"),
      desktopLabel: t("desktopLabel"),
      orientationLabel: t("orientationLabel"),
      portraitLabel: t("portraitLabel"),
      landscapeLabel: t("landscapeLabel"),
      rotateLabel: t("rotateLabel"),
      zoomLabel: t("zoomLabel"),
      zoomOutLabel: t("zoomOutLabel"),
      zoomInLabel: t("zoomInLabel"),
      zoomResetLabel: t("zoomResetLabel"),
      previewTitle: t("previewTitle"),
      previewEmpty: t("previewEmpty"),
      viewportSizeLabel: t("viewportSizeLabel"),
      frameChromeLabel: t("frameChromeLabel"),
      overviewTitle: t("overviewTitle"),
      overviewIntro: t("overviewIntro"),
      overviewPdfTitle: t("overviewPdfTitle"),
      overviewPdfBody: t("overviewPdfBody"),
      overviewUrlTitle: t("overviewUrlTitle"),
      overviewUrlBody: t("overviewUrlBody"),
      overviewHtmlTitle: t("overviewHtmlTitle"),
      overviewHtmlBody: t("overviewHtmlBody"),
      overviewDevicesTitle: t("overviewDevicesTitle"),
      overviewDevicesBody: t("overviewDevicesBody"),
      overviewControlsTitle: t("overviewControlsTitle"),
      overviewControlsBody: t("overviewControlsBody"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="responsive-device-preview-tool-page">
      <ResponsiveDevicePreview labels={labels} />
    </UtilityWorkspaceShell>
  );
}
