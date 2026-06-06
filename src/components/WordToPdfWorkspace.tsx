"use client";

import { ConvertToolWorkspace } from "@/components/ConvertToolWorkspace";
import type { ToolDefinition } from "@/lib/types";
import {
  convertDocxToPdf,
  wordToPdfOutputName,
  type WordToPdfProgress,
} from "@/lib/word-to-pdf";

function progressPercent(progress: WordToPdfProgress | null, busy: boolean): number {
  if (!progress) return busy ? 10 : 0;
  if (progress.phase === "parsing") return 30;
  if (progress.phase === "rendering") return 65;
  return 92;
}

const CONFIG = {
  accept: (f: File) =>
    /\.docx$/i.test(f.name) ||
    f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  acceptAttr:
    ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  progressPercent,
  convert: convertDocxToPdf,
  outputName: wordToPdfOutputName,
};

export function WordToPdfWorkspace({ tool, slug }: { tool: ToolDefinition; slug: string }) {
  return <ConvertToolWorkspace tool={tool} slug={slug} config={CONFIG} />;
}
