"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";
import {
  ColorPaletteStudio,
  type ColorPaletteStudioLabels,
} from "@/components/tools/design/ColorPaletteStudio";
import type { HarmonyMode } from "@/lib/color-palette-studio";

type ColorPaletteStudioWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

const HARMONY_KEYS: HarmonyMode[] = [
  "analogous",
  "complementary",
  "triadic",
  "splitComplementary",
  "tetradic",
  "monochromatic",
];

export function ColorPaletteStudioWorkspace({ tool, slug }: ColorPaletteStudioWorkspaceProps) {
  const t = useTranslations("ColorPaletteStudio");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ColorPaletteStudioLabels>(() => {
    const harmonies = Object.fromEntries(
      HARMONY_KEYS.map((mode) => [mode, t(`harmonies.${mode}`)]),
    ) as Record<HarmonyMode, string>;

    return {
      generatorTitle: t("generatorTitle"),
      generatorDesc: t("generatorDesc"),
      extractorTitle: t("extractorTitle"),
      extractorDesc: t("extractorDesc"),
      converterTitle: t("converterTitle"),
      converterDesc: t("converterDesc"),
      harmonyLabel: t("harmonyLabel"),
      regenerate: t("regenerate"),
      lock: t("lock"),
      unlock: t("unlock"),
      copyHex: t("copyHex"),
      copyRgb: t("copyRgb"),
      copyHsl: t("copyHsl"),
      copied: t("copied"),
      copyFailed: t("copyFailed"),
      downloadCss: t("downloadCss"),
      downloadJson: t("downloadJson"),
      dropHint: t("dropHint"),
      browse: t("browse"),
      extracting: t("extracting"),
      extractError: t("extractError"),
      invalidImage: t("invalidImage"),
      clearImage: t("clearImage"),
      privacyLabel: t("privacyLabel"),
      fgLabel: t("fgLabel"),
      bgLabel: t("bgLabel"),
      previewLabel: t("previewLabel"),
      ratioLabel: t("ratioLabel"),
      pass: t("pass"),
      fail: t("fail"),
      aaNormal: t("aaNormal"),
      aaLarge: t("aaLarge"),
      aaaNormal: t("aaaNormal"),
      aaaLarge: t("aaaLarge"),
      sampleText: t("sampleText"),
      hexLabel: t("hexLabel"),
      rgbLabel: t("rgbLabel"),
      hslLabel: t("hslLabel"),
      harmonies,
    };
  }, [t]);

  return (
    <UtilityWorkspaceShell immersive pageClassName="color-palette-studio-tool-page">
      <ColorPaletteStudio labels={labels} />
    </UtilityWorkspaceShell>
  );
}
