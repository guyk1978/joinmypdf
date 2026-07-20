"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import {
  QRCodeGenerator,
  type QRCodeGeneratorLabels,
} from "@/components/tools/developer/QRCodeGenerator";

type QRCodeGeneratorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function QRCodeGeneratorWorkspace({ tool, slug }: QRCodeGeneratorWorkspaceProps) {
  const t = useTranslations("QRCodeGenerator");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<QRCodeGeneratorLabels>(
    () => ({
      inputLabel: t("inputLabel"),
      inputPlaceholder: t("inputPlaceholder"),
      optionsTitle: t("optionsTitle"),
      sizeLabel: t("sizeLabel"),
      sizeSmall: t("sizeSmall"),
      sizeMedium: t("sizeMedium"),
      sizeLarge: t("sizeLarge"),
      errorCorrectionLabel: t("errorCorrectionLabel"),
      errorLow: t("errorLow"),
      errorMedium: t("errorMedium"),
      errorHigh: t("errorHigh"),
      foregroundColorLabel: t("foregroundColorLabel"),
      foregroundColorHint: t("foregroundColorHint"),
      presetAriaPrefix: t("presetAriaPrefix"),
      outputTitle: t("outputTitle"),
      outputEmpty: t("outputEmpty"),
      downloadButton: t("downloadButton"),
      copyImageButton: t("copyImageButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      generateError: t("generateError"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="qr-generator-tool-page">
      <QRCodeGenerator labels={labels} />
    </UtilityWorkspaceShell>
  );
}
