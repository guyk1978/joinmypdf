import type { getTranslations } from "next-intl/server";
import type { ToolDefinition, ToolVariant } from "./types";
import { translateToolItem } from "./i18n-tool-labels";

export type ToolPageTranslator = Awaited<ReturnType<typeof getTranslations<"ToolPage">>>;
export type ToolsTranslator = Awaited<ReturnType<typeof getTranslations<"Tools">>>;

const ACTION_KEYS: Record<string, string> = {
  merge: "merge",
  compress: "compress",
  split: "split",
  "batch-rename-pdf": "batchRename",
  "pdf-text-editor": "textEditor",
  "compare-pdf": "compare",
  "pdf-to-booklet": "booklet",
  "safe-to-share-auditor": "safeShare",
  "custom-paper-margin": "paperMargin",
  "delete-pages": "deletePages",
  "add-page-numbers": "pageNumbers",
  "crop-pdf": "crop",
  "add-watermark": "watermark",
  "rotate-pdf": "rotate",
  "autocad-to-pdf": "autocad",
  "openoffice-to-pdf": "openoffice",
  "markdown-to-pdf": "markdown",
  "html-to-pdf": "html",
  "ebook-to-pdf": "ebook",
  "iwork-to-pdf": "iwork",
  protect: "protect",
  unlock: "unlock",
  "pdf-password-recovery": "passwordRecovery",
  redact: "redact",
  "flatten-pdf": "flatten",
  "remove-hidden-metadata": "removeMetadata",
  sign: "sign",
  "jpg-to-pdf": "jpgToPdf",
  "png-to-pdf": "pngToPdf",
  "heic-to-pdf": "heicToPdf",
  "pdf-to-jpg": "pdfToJpg",
  "pdf-to-png": "pdfToPng",
  "pdf-to-text": "pdfToText",
  "extract-images": "extractImages",
  "word-to-pdf": "wordToPdf",
  "excel-to-pdf": "excelToPdf",
  "powerpoint-to-pdf": "powerpointToPdf",
  "pdf-to-powerpoint": "pdfToPowerpoint",
  "pdf-to-excel": "pdfToExcel",
};

function toolActionPhrase(t: ToolPageTranslator, operation: string): string {
  const key = ACTION_KEYS[operation];
  if (key && t.has(`actions.${key}`)) return t(`actions.${key}`);
  return t("actions.default");
}

export function translateToolIntent(
  tTools: ToolsTranslator,
  slug: string,
  fallback: string,
): string {
  const key = `intents.${slug}`;
  return tTools.has(key) ? tTools(key) : fallback;
}

export function localizedToolTitle(
  tTools: ToolsTranslator,
  tool: ToolDefinition,
  variant: ToolVariant | null,
): string {
  const base = translateToolItem(tTools, tool.slug, tool.title);
  return variant ? `${base} — ${variant.keyword}` : base;
}

export function buildLocalizedGuideParagraphs(
  t: ToolPageTranslator,
  tool: ToolDefinition,
  variant: ToolVariant | null,
): string[] {
  const kw = variant?.keyword || tool.primaryKeyword;
  const action = toolActionPhrase(t, tool.operation);
  const secondary = (tool.secondaryKeywords || []).slice(0, 4).join(", ");
  const useCases = (tool.useCases || []).slice(0, 2).join(` ${t("guide.useCasesJoin")} `);
  const toolTitle = tool.title;

  const p1 = variant
    ? t("guide.variantP1", { action, keyword: kw, toolTitle })
    : t("guide.defaultP1", { description: tool.description, action });

  const p2 = t("guide.p2");
  const p3 = variant?.angle
    ? t("guide.variantP3", { keyword: kw, angle: variant.angle.toLowerCase(), toolTitle })
    : t("guide.defaultP3");
  const p4 =
    secondary.length > 0 ? t("guide.p4WithSecondary", { secondary }) : t("guide.p4Default");
  const p5 = useCases.length > 0 ? t("guide.p5WithCases", { useCases }) : t("guide.p5Default");
  const p6 = t("guide.p6");

  return [p1, p2, p3, p4, p5, p6];
}

export function getLocalizedToolFaqs(
  t: ToolPageTranslator,
  tool: ToolDefinition,
  variant: ToolVariant | null,
  toolTitle: string,
  locale: string,
): { q: string; a: string }[] {
  if (!variant && tool.faq?.length && locale === "en") return tool.faq;

  if (!variant) {
    return [
      { q: t("faqs.freeQ", { toolTitle }), a: t("faqs.freeA") },
      { q: t("faqs.uploadQ"), a: t("faqs.uploadA") },
      { q: t("faqs.watermarkQ"), a: t("faqs.watermarkA") },
      { q: t("faqs.mobileQ"), a: t("faqs.mobileA") },
    ];
  }

  const angle = variant.angle || t("faqs.variantAngleDefault");
  return [
    { q: t("faqs.variantSameQ", { toolTitle }), a: t("faqs.variantSameA") },
    { q: t("faqs.variantKeywordQ", { keyword: variant.keyword }), a: angle },
    { q: t("faqs.variantBackendQ"), a: t("faqs.variantBackendA") },
    { q: t("faqs.variantMainPageQ", { toolTitle }), a: t("faqs.variantMainPageA", { slug: tool.slug }) },
  ];
}
