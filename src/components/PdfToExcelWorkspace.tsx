"use client";

import { ConvertToolWorkspace } from "@/components/ConvertToolWorkspace";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { formatPageCount } from "@/lib/workspace-meta-i18n";
import type { ToolDefinition } from "@/lib/types";
import {
  convertPdfToExcel,
  pdfToExcelOutputName,
  type PdfToExcelProgress,
} from "@/lib/pdf-to-excel";
import { loadPdfDocument } from "@/lib/pdf-text-extract";
import { useMemo } from "react";

function progressPercent(progress: PdfToExcelProgress | null, busy: boolean): number {
  if (!progress) return busy ? 10 : 0;
  if (progress.phase === "loading") return 18;
  if (progress.phase === "building") return 92;
  if (!progress.totalPages) return 40;
  return Math.min(85, Math.round((progress.currentPage / progress.totalPages) * 85));
}

export function PdfToExcelWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const config = useMemo(
    () => ({
      accept: (f: File) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name),
      acceptAttr: "application/pdf,.pdf",
      progressPercent,
      readMeta: async (file: File) => {
        const doc = await loadPdfDocument(file);
        return formatPageCount(ws, doc.numPages);
      },
      convert: convertPdfToExcel,
      outputName: pdfToExcelOutputName,
    }),
    [ws],
  );

  return <ConvertToolWorkspace tool={tool} slug={slug} config={config} />;
}
