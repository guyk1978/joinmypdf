"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  ImageCombiner,
  type ImageCombinerLabels,
} from "@/components/ImageCombiner";
import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";
import { dispatchToolComplete } from "@/lib/subscription-modal";
import type { ToolDefinition } from "@/lib/types";

type ImageCombinerWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function ImageCombinerWorkspace({ tool, slug }: ImageCombinerWorkspaceProps) {
  const t = useTranslations("ImageCombiner");
  const tTools = useTranslations("Tools");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<ImageCombinerLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      addMoreTitle: t("addMoreTitle"),
      dropHint: t("dropHint"),
      selectFiles: t("selectFiles"),
      selectFilesAria: t("selectFilesAria"),
      selectedTitle: t("selectedTitle"),
      selectedCount: (count, max) => t("selectedCount", { count, max }),
      reorderHint: t("reorderHint"),
      remove: t("remove"),
      moveEarlier: t("moveEarlier"),
      moveLater: t("moveLater"),
      settingsTitle: t("settingsTitle"),
      layoutLabel: t("layoutLabel"),
      horizontal: t("horizontal"),
      vertical: t("vertical"),
      combine: t("combine"),
      combining: t("combining"),
      resultTitle: t("resultTitle"),
      resultDimensions: (width, height) => t("resultDimensions", { width, height }),
      downloadResult: t("downloadResult"),
      startOver: t("startOver"),
      privacyLabel: t("privacyLabel"),
      invalidFile: t("invalidFile"),
      tooManyFiles: t("tooManyFiles"),
      needMoreFiles: t("needMoreFiles"),
      errorGeneric: t("errorGeneric"),
      successHint: t("successHint"),
      pageTitle: tTools("items.image-combiner"),
    }),
    [t, tTools],
  );

  return (
    <UtilityWorkspaceShell pageClassName="image-combiner-tool-page">
      <ImageCombiner
        labels={labels}
        onStart={() => {
          capture(EVENTS.tool_run_start, { operation: tool.operation, slug });
        }}
        onComplete={() => {
          capture(EVENTS.tool_run_success, { operation: tool.operation, slug });
          window.setTimeout(() => {
            dispatchToolComplete({ operation: tool.operation, slug });
          }, 400);
        }}
      />
    </UtilityWorkspaceShell>
  );
}
