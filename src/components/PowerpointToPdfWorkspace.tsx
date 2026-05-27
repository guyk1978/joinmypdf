"use client";

import { ConvertToolWorkspace } from "@/components/ConvertToolWorkspace";
import type { ToolDefinition } from "@/lib/types";
import {
  convertPptxToPdf,
  powerpointToPdfOutputName,
  readPowerpointMeta,
  type PowerpointToPdfProgress,
} from "@/lib/powerpoint-to-pdf";

function progressLabel(progress: PowerpointToPdfProgress | null): string {
  if (!progress) return "";
  if (progress.phase === "parsing") {
    if (progress.currentSlide && progress.totalSlides) {
      return `Reading slide ${progress.currentSlide} of ${progress.totalSlides}…`;
    }
    return "Reading presentation…";
  }
  if (progress.phase === "rendering") return "Rendering slide layout…";
  return "Building landscape PDF…";
}

function progressPercent(progress: PowerpointToPdfProgress | null, busy: boolean): number {
  if (!progress) return busy ? 10 : 0;
  if (progress.phase === "parsing") {
    if (progress.currentSlide && progress.totalSlides) {
      return Math.min(55, Math.round((progress.currentSlide / progress.totalSlides) * 55));
    }
    return 25;
  }
  if (progress.phase === "rendering") return 70;
  return 92;
}

const CONFIG = {
  accept: (f: File) =>
    /\.pptx$/i.test(f.name) ||
    f.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  acceptAttr:
    ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation",
  dropTitle: "Drop a PowerPoint file here or click to browse",
  dropDescription: "Convert .pptx to a landscape PDF locally—no upload required.",
  invalidTypeMessage: "Please choose a .pptx PowerPoint file.",
  emptyFileMessage: "That file is empty. Choose another presentation.",
  privacyNote:
    "PowerPoint parsing and PDF generation run entirely in your browser. Your presentation never leaves your device.",
  fileTypeLabel: "PowerPoint (.pptx)",
  convertLabel: "Convert to PDF",
  downloadLabel: "Download PDF",
  outputHint:
    "Slide text exports into a landscape PDF. Images, animations, and complex layouts may simplify.",
  stickyDownloadLabel: "Download PDF",
  stickyConvertLabel: "Convert to PDF",
  progressLabel,
  progressPercent,
  readMeta: async (file: File) => {
    const meta = await readPowerpointMeta(file);
    return `${meta.slideCount} slide${meta.slideCount === 1 ? "" : "s"}`;
  },
  convert: convertPptxToPdf,
  outputName: powerpointToPdfOutputName,
};

export function PowerpointToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  return <ConvertToolWorkspace tool={tool} slug={slug} config={CONFIG} />;
}
