"use client";

import { ConvertToolWorkspace } from "@/components/ConvertToolWorkspace";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { formatPageCount } from "@/lib/workspace-meta-i18n";
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
      convert: convertPdfToHtml,
      outputName: pdfToHtmlOutputName,
    }),
    [ws],
  );

  return <ConvertToolWorkspace tool={tool} slug={slug} config={config} />;
}
