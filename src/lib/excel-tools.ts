import { registry } from "@/lib/registry";
import type { ToolGridItem } from "@/lib/tool-grid";

export const EXCEL_TOOL_IDS = ["excel-to-pdf", "pdf-to-excel"] as const;

export const EXCEL_TOOLS_HUB_PATH = "/tools/excel-tools/";

export type ExcelToolId = (typeof EXCEL_TOOL_IDS)[number];

const EXCEL_TOOL_MESSAGE_KEYS: Record<ExcelToolId, string> = {
  "excel-to-pdf": "excelToPdf",
  "pdf-to-excel": "pdfToExcel",
};

type ExcelToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

function getToolTitle(slug: string): string | undefined {
  return registry.tools.find((tool) => tool.slug === slug)?.title;
}

export function buildExcelToolGridItems(t?: ExcelToolsTranslator): ToolGridItem[] {
  return EXCEL_TOOL_IDS.map((id) => {
    const messageKey = EXCEL_TOOL_MESSAGE_KEYS[id];
    const labelKey = `tools.${messageKey}`;
    const fallback = getToolTitle(id) ?? id;
    const label = t?.has(labelKey) ? t(labelKey) : fallback;

    return {
      href: `/tools/${id}/`,
      label,
      slugHint: id,
    };
  });
}

export function getExcelToolFeatureLabels(t?: ExcelToolsTranslator): string[] {
  return buildExcelToolGridItems(t).map((item) => item.label);
}
