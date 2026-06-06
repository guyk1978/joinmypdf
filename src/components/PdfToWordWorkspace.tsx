"use client";

import { ConvertToolWorkspace } from "@/components/ConvertToolWorkspace";
import type { ToolDefinition } from "@/lib/types";
import {
  convertPdfToDocx,
  pdfToWordOutputName,
  type PdfToWordProgress,
} from "@/lib/pdf-to-word";
import { loadPdfDocument } from "@/lib/pdf-text-extract";

function progressPercent(progress: PdfToWordProgress | null, busy: boolean): number {
  if (progress && progress.totalPages > 0) {
    return Math.min(
      100,
      Math.round(
        ((progress.phase === "building" ? progress.totalPages : progress.currentPage) /
          progress.totalPages) *
          100,
      ),
    );
  }
  return busy ? 12 : 0;
}

const CONFIG = {
  accept: (f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name),
  acceptAttr: "application/pdf,.pdf",
  progressPercent,
  readMeta: async (file: File) => {
    const doc = await loadPdfDocument(file);
    return `${doc.numPages} page${doc.numPages === 1 ? "" : "s"}`;
  },
  convert: convertPdfToDocx,
  outputName: pdfToWordOutputName,
};

export function PdfToWordWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  return <ConvertToolWorkspace tool={tool} slug={slug} config={CONFIG} />;
}
