"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import { ColorConverter, type ColorConverterLabels } from "@/components/tools/design/ColorConverter";

type ColorConverterWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ColorConverterWorkspace({ tool, slug }: ColorConverterWorkspaceProps) {
  const t = useTranslations("ColorConverter");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ColorConverterLabels>(
    () => ({
      previewLabel: t("previewLabel"),
      pickerLabel: t("pickerLabel"),
      hexLabel: t("hexLabel"),
      rgbLabel: t("rgbLabel"),
      hslLabel: t("hslLabel"),
      hexPlaceholder: t("hexPlaceholder"),
      rgbPlaceholder: t("rgbPlaceholder"),
      hslPlaceholder: t("hslPlaceholder"),
      copyButton: t("copyButton"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      invalidValue: t("invalidValue"),
      privacyLabel: t("privacyLabel"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell immersive pageClassName="color-converter-tool-page">
      <ColorConverter labels={labels} />
    </UtilityWorkspaceShell>
  );
}
