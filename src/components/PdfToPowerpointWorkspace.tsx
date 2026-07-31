"use client";

import { ConvertToolWorkspace } from "@/components/ConvertToolWorkspace";
import type { ToolDefinition } from "@/lib/types";
import {
  convertPdfToPptx,
  pdfToPowerpointOutputName,
  type PdfToPowerpointProgress,
} from "@/lib/pdf-to-powerpoint";
import { loadPdfDocument } from "@/lib/pdf-text-extract";
import { useMemo } from "react";

function progressPercent(progress: PdfToPowerpointProgress | null, busy: boolean): number {
  if (!progress) return busy ? 10 : 0;
  if (progress.phase === "loading") return 18;
  if (progress.phase === "building") return 92;
  if (!progress.totalPages) return 40;
  return Math.min(85, Math.round((progress.currentPage / progress.totalPages) * 85));
}

export function PdfToPowerpointWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
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
      convert: convertPdfToPptx,
      outputName: pdfToPowerpointOutputName,
    }),
    [],
  );

  return <ConvertToolWorkspace tool={tool} slug={slug} config={config} />;
}
