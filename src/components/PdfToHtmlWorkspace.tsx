"use client";

import { ConvertToolWorkspace } from "@/components/ConvertToolWorkspace";
import type { ToolDefinition } from "@/lib/types";
import {
  convertPdfToHtml,
  pdfToHtmlOutputName,
  type PdfToHtmlProgress,
} from "@/lib/pdf-to-html";
import { loadPdfDocument } from "@/lib/pdf-text-extract";
import { useMemo } from "react";

function progressPercent(progress: PdfToHtmlProgress | null, busy: boolean): number {
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

export function PdfToHtmlWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const config = useMemo(
    () => ({
      accept: (f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name),
      acceptAttr: "application/pdf,.pdf",
      progressPercent,
      readPdfPreview: async (file: File) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc = await loadPdfDocument(file);
        return { bytes: bytes.slice(), pageCount: doc.numPages };
      },
      convert: convertPdfToHtml,
      outputName: pdfToHtmlOutputName,
    }),
    [],
  );

  return <ConvertToolWorkspace tool={tool} slug={slug} config={config} />;
}
