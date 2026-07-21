"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { capture, EVENTS } from "@/components/AnalyticsClient";
import { FaviconCompressor, type FaviconCompressorLabels } from "@/components/FaviconCompressor";
import { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell";
import { WORKSPACE_OPERATIONS_ID } from "@/lib/workspace-flow";
import type { ToolDefinition } from "@/lib/types";

type FaviconCompressorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

export function FaviconCompressorWorkspace({ tool, slug }: FaviconCompressorWorkspaceProps) {
  const t = useTranslations("FaviconCompressor");

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const labels = useMemo<FaviconCompressorLabels>(
    () => ({
      dropTitle: t("dropTitle"),
      dropHint: t("dropHint"),
      selectFile: t("selectFile"),
      selectFileAria: t("selectFileAria"),
      compressInstructions: t("compressInstructions"),
      formatFileInfo: (name, width, height) => t("fileInfo", { name, width, height }),
      formatIcoFileInfo: (name, frameCount) => t("icoFileInfo", { name, frameCount }),
      originalSize: t("originalSize"),
      compressedSize: t("compressedSize"),
      estimatingSize: t("estimatingSize"),
      formatSavings: (percent) => t("formatSavings", { percent }),
      savingsCalculator: {
        title: t("savingsTitle"),
        hint: t("savingsHint"),
        calculating: t("savingsCalculating"),
        compressedBy: (percent) => t("savingsCompressedBy", { percent }),
        savedAmount: (saved, bytes) => t("savingsSavedAmount", { saved, bytes }),
        alreadyOptimal: t("savingsAlreadyOptimal"),
        noSavingsYet: t("savingsNoSavingsYet"),
      },
      downloadOptimized: t("downloadOptimized"),
      optimizing: t("optimizing"),
      optimizingProgress: t("optimizingProgress"),
      invalidFile: t("invalidFile"),
      optimizeFailed: t("optimizeFailed"),
      replaceFile: t("replaceFile"),
      privacyBadgeWaiting: t("privacyBadgeWaiting"),
      privacyBadgeProcessing: t("privacyBadgeProcessing"),
      privacyBadgeLocal: t("privacyBadgeLocal"),
      compressionModeLabel: t("compressionModeLabel"),
      compressionModeLossy: t("compressionModeLossy"),
      compressionModeLossyHint: t("compressionModeLossyHint"),
      compressionModeLossless: t("compressionModeLossless"),
      compressionModeLosslessHint: t("compressionModeLosslessHint"),
      formatDetectedLabel: t("formatDetectedLabel"),
      formatLabel: (format) => t(`formats.${format}` as "formats.ico"),
      metadataReport: {
        title: t("metadataReportTitle"),
        hint: t("metadataReportHint"),
        scanning: t("metadataReportScanning"),
        removedPrefix: t("metadataReportRemovedPrefix"),
        removedItem: (item) => t("metadataReportRemovedItem", { item }),
        totalRemoved: (bytes) => t("metadataReportTotalRemoved", { bytes }),
        noMetadata: t("metadataReportNoMetadata"),
        awaitingCompression: t("metadataReportAwaitingCompression"),
        categories: {
          exif: t("metadataCategories.exif"),
          "icc-profile": t("metadataCategories.iccProfile"),
          xmp: t("metadataCategories.xmp"),
          photoshop: t("metadataCategories.photoshop"),
          "png-text": t("metadataCategories.pngText"),
          "png-time": t("metadataCategories.pngTime"),
          comment: t("metadataCategories.comment"),
          thumbnail: t("metadataCategories.thumbnail"),
        },
      },
      beforeAfterCompare: {
        title: t("compareTitle"),
        hint: t("compareHint"),
        beforeLabel: t("compareBeforeLabel"),
        afterLabel: t("compareAfterLabel"),
        sliderAria: t("compareSliderAria"),
        waitingForCompression: t("compareWaitingForCompression"),
        calculating: t("compareCalculating"),
        weightSavingsTitle: t("weightSavingsTitle"),
        weightSavingsHint: t("weightSavingsHint"),
        originalWeight: t("originalSize"),
        optimizedWeight: t("compressedSize"),
        bytesSaved: (saved, bytes) => t("weightSavingsBytesSaved", { saved, bytes }),
        noSavingsYet: t("weightSavingsNoSavingsYet"),
        alreadyOptimal: t("savingsAlreadyOptimal"),
      },
    }),
    [t],
  );

  return (
    <WorkspaceUploadShell>
      <div
        id={WORKSPACE_OPERATIONS_ID}
        className="crop-image-tool-page favicon-compressor-tool-page w-full min-h-0 flex-1"
      >
        <FaviconCompressor labels={labels} />
      </div>
    </WorkspaceUploadShell>
  );
}
