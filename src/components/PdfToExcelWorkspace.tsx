"use client";

import { ConvertToolWorkspace } from "@/components/ConvertToolWorkspace";
import type { ToolDefinition } from "@/lib/types";
import {
  convertPdfToExcel,
  pdfToExcelOutputName,
  type PdfToExcelProgress,
} from "@/lib/pdf-to-excel";
import { loadPdfDocument } from "@/lib/pdf-text-extract";

function progressLabel(progress: PdfToExcelProgress | null): string {
  if (!progress) return "";
  if (progress.phase === "loading") return "Loading PDF…";
  if (progress.phase === "building") return "Building Excel workbook…";
  return `Extracting rows — page ${progress.currentPage} of ${progress.totalPages}…`;
}

function progressPercent(progress: PdfToExcelProgress | null, busy: boolean): number {
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
  dropDescription: "Extract PDF text into an editable .xlsx workbook—no upload required.",
  invalidTypeMessage: "Please choose a PDF file.",
  emptyFileMessage: "That file is empty. Choose another PDF.",
  privacyNote:
    "PDF parsing and Excel generation run entirely in your browser. Your document never leaves your device.",
  fileTypeLabel: "PDF",
  convertLabel: "Convert to Excel",
  downloadLabel: "Download Excel (.xlsx)",
  outputHint:
    "Each PDF page becomes a worksheet with text grouped into rows and columns by position. Tables may need cleanup.",
  stickyDownloadLabel: "Download .xlsx",
  stickyConvertLabel: "Convert to Excel",
  progressLabel,
  progressPercent,
  readMeta: async (file: File) => {
    const doc = await loadPdfDocument(file);
    return `${doc.numPages} page${doc.numPages === 1 ? "" : "s"}`;
  },
  convert: convertPdfToExcel,
  outputName: pdfToExcelOutputName,
};

export function PdfToExcelWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  return <ConvertToolWorkspace tool={tool} slug={slug} config={CONFIG} />;
}
