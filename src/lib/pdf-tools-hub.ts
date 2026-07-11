import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const PDF_TOOLS_HUB_PATH = "/tools/pdf-tools/";

export type PdfToolGroupId = "core" | "conversion" | "utilities";

export type PdfToolId =
  | "pdf-merge"
  | "pdf-split"
  | "pdf-to-word"
  | "pdf-to-jpg"
  | "word-to-pdf"
  | "jpg-to-pdf"
  | "pdf-compress"
  | "unlock-pdf"
  | "rotate-pdf";

/** Flagship tools shown first for CTR. */
export const PDF_POPULAR_IDS = ["pdf-merge", "pdf-split"] as const satisfies readonly PdfToolId[];

export const PDF_TOOL_GROUPS: {
  id: PdfToolGroupId;
  toolIds: readonly PdfToolId[];
}[] = [
  {
    id: "core",
    toolIds: ["pdf-merge", "pdf-split"],
  },
  {
    id: "conversion",
    toolIds: ["pdf-to-word", "pdf-to-jpg", "word-to-pdf", "jpg-to-pdf"],
  },
  {
    id: "utilities",
    toolIds: ["pdf-compress", "unlock-pdf", "rotate-pdf"],
  },
];

export const PDF_TOOL_IDS = [
  ...new Set([...PDF_POPULAR_IDS, ...PDF_TOOL_GROUPS.flatMap((group) => [...group.toolIds])]),
] as PdfToolId[];

const PDF_TOOL_MESSAGE_KEYS: Record<PdfToolId, string> = {
  "pdf-merge": "mergePdf",
  "pdf-split": "splitPdf",
  "pdf-to-word": "pdfToWord",
  "pdf-to-jpg": "pdfToJpg",
  "word-to-pdf": "wordToPdf",
  "jpg-to-pdf": "imageToPdf",
  "pdf-compress": "compressPdf",
  "unlock-pdf": "unlockPdf",
  "rotate-pdf": "rotatePdf",
};

/** Hub-facing labels for clearer intents. */
const PDF_HUB_LABEL_OVERRIDES: Partial<Record<PdfToolId, string>> = {
  "pdf-compress": "pdfCompressor",
  "unlock-pdf": "pdfUnlocker",
  "rotate-pdf": "pdfRotator",
  "jpg-to-pdf": "imageToPdf",
};

type PdfToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

function resolvePdfToolLabel(id: PdfToolId, t?: PdfToolsTranslator): string {
  const overrideKey = PDF_HUB_LABEL_OVERRIDES[id];
  if (overrideKey) {
    const hubKey = `tools.${overrideKey}`;
    if (t?.has(hubKey)) return t(hubKey);
  }

  const messageKey = PDF_TOOL_MESSAGE_KEYS[id];
  const labelKey = `tools.${messageKey}`;
  const fallback = getToolTitle(id) ?? id;
  return t?.has(labelKey) ? t(labelKey) : fallback;
}

export function buildPdfToolGridItem(
  id: PdfToolId,
  t?: PdfToolsTranslator,
  slugHintSuffix?: string,
): ToolGridItem {
  return {
    href: `/tools/${id}/`,
    label: resolvePdfToolLabel(id, t),
    slugHint: slugHintSuffix ? `${id}-${slugHintSuffix}` : id,
  };
}

export function buildPdfPopularItems(t?: PdfToolsTranslator): ToolGridItem[] {
  return PDF_POPULAR_IDS.map((id) => buildPdfToolGridItem(id, t, "popular"));
}

export function buildPdfToolGroupItems(
  groupId: PdfToolGroupId,
  t?: PdfToolsTranslator,
): ToolGridItem[] {
  const group = PDF_TOOL_GROUPS.find((entry) => entry.id === groupId);
  if (!group) return [];
  return group.toolIds.map((id) => buildPdfToolGridItem(id, t));
}

export function getPdfToolFeatureLabels(t?: PdfToolsTranslator): string[] {
  const labels = PDF_TOOL_IDS.map((id) => resolvePdfToolLabel(id, t));
  return ["PDF Manipulation", ...labels];
}
