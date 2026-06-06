"use client";

import { ConvertToolWorkspace } from "@/components/ConvertToolWorkspace";
import { useWorkspaceI18n } from "@/hooks/useWorkspaceI18n";
import { formatSlideCount } from "@/lib/workspace-meta-i18n";
import type { ToolDefinition } from "@/lib/types";
import {
  convertPptxToPdf,
  powerpointToPdfOutputName,
  readPowerpointMeta,
  type PowerpointToPdfProgress,
} from "@/lib/powerpoint-to-pdf";
import { useMemo } from "react";

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

export function PowerpointToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  const ws = useWorkspaceI18n(tool.operation);
  const config = useMemo(
    () => ({
      accept: (f: File) =>
        /\.pptx$/i.test(f.name) ||
        f.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      acceptAttr: ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation",
      progressPercent,
      readMeta: async (file: File) => {
        const meta = await readPowerpointMeta(file);
        return formatSlideCount(ws, meta.slideCount);
      },
      convert: convertPptxToPdf,
      outputName: powerpointToPdfOutputName,
    }),
    [ws],
  );

  return <ConvertToolWorkspace tool={tool} slug={slug} config={config} />;
}
