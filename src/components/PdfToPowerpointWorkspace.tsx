"use client";

import { ConvertToolWorkspace } from "@/components/ConvertToolWorkspace";
import type { ToolDefinition } from "@/lib/types";
import {
  convertPdfToPptx,
  pdfToPowerpointOutputName,
  type PdfToPowerpointProgress,
} from "@/lib/pdf-to-powerpoint";
import { loadPdfDocument } from "@/lib/pdf-text-extract";

function progressLabel(progress: PdfToPowerpointProgress | null): string {
  if (!progress) return "";
  if (progress.phase === "loading") return "Loading PDF…";
  if (progress.phase === "building") return "Building PowerPoint file…";
  return `Extracting text — page ${progress.currentPage} of ${progress.totalPages}…`;
}

function progressPercent(progress: PdfToPowerpointProgress | null, busy: boolean): number {
  if (!progress) return busy ? 10 : 0;
  if (progress.phase === "loading") return 18;
  if (progress.phase === "building") return 92;
  if (!progress.totalPages) return 40;
  return Math.min(85, Math.round((progress.currentPage / progress.totalPages) * 85));
}

const CONFIG = {
  accept: (f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name),
  acceptAttr: "application/pdf,.pdf",
  dropTitle: "Drop a PDF here or click to browse",
  dropDescription: "Convert PDF pages into an editable .pptx deck—processed locally.",
  invalidTypeMessage: "Please choose a PDF file.",
  emptyFileMessage: "That file is empty. Choose another PDF.",
  privacyNote:
    "PDF parsing and PowerPoint generation run entirely in your browser. Your document never leaves your device.",
  fileTypeLabel: "PDF",
  convertLabel: "Convert to PowerPoint",
  downloadLabel: "Download PowerPoint (.pptx)",
  outputHint:
    "Each PDF page becomes one slide with extracted text. Scanned pages without selectable text may be blank.",
  stickyDownloadLabel: "Download .pptx",
  stickyConvertLabel: "Convert to PowerPoint",
  progressLabel,
  progressPercent,
  readMeta: async (file: File) => {
    const doc = await loadPdfDocument(file);
    return `${doc.numPages} page${doc.numPages === 1 ? "" : "s"}`;
  },
  convert: convertPdfToPptx,
  outputName: pdfToPowerpointOutputName,
};

export function PdfToPowerpointWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  return <ConvertToolWorkspace tool={tool} slug={slug} config={CONFIG} />;
}
