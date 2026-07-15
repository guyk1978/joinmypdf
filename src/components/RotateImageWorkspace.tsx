"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { RotateImage, type RotateImageLabels } from "@/components/RotateImage";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import type { ToolDefinition } from "@/lib/types";

type RotateImageWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function RotateImageWorkspace({ tool, slug }: RotateImageWorkspaceProps) {
  const t = useTranslations("RotateImage");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<RotateImageLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      rotateInstructions: t("rotateInstructions"),
      toolbarTitle: t("toolbarTitle"),
      quickRotateTitle: t("quickRotateTitle"),
      rotateLeft: t("rotateLeft"),
      rotateRight: t("rotateRight"),
      rotate180: t("rotate180"),
      precisionTitle: t("precisionTitle"),
      precisionLabel: t("precisionLabel"),
      applyPrecision: t("applyPrecision"),
      flipTitle: t("flipTitle"),
      flipHorizontal: t("flipHorizontal"),
      flipVertical: t("flipVertical"),
      autoAlignTitle: t("autoAlignTitle"),
      autoAlignButton: t("autoAlignButton"),
      autoAlignBusy: t("autoAlignBusy"),
      autoAlignDone: t("autoAlignDone"),
      autoAlignHint: t("autoAlignHint"),
      formatRotation: (degrees) => t("rotation", { degrees }),
      flipState: (horizontal, vertical) => {
        if (horizontal && vertical) return t("flipBoth");
        if (horizontal) return t("flipHorizontalOn");
        if (vertical) return t("flipVerticalOn");
        return t("flipNone");
      },
      download: t("download"),
      downloading: t("downloading"),
      invalidFile: t("invalidFile"),
      replaceImage: t("replaceImage"),
      suiteLinksTitle: t("suiteLinksTitle"),
      linkRotatePdf: t("linkRotatePdf"),
      linkVideoRotator: t("linkVideoRotator"),
      deskewFailed: t("deskewFailed"),
    }),
    [t],
  );

  return (
    <UtilityWorkspaceShell pageClassName="rotate-align-suite-page">
      <RotateImage
        labels={labels}
        rotatePdfHref="/tools/rotate-pdf/"
        videoRotatorHref="/tools/video-rotator/"
      />
    </UtilityWorkspaceShell>
  );
}
