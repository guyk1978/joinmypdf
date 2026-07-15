import type { getTranslations } from "next-intl/server";
import type { ToolDefinition, ToolVariant } from "./types";
import { buildLocalizedToolFaqs } from "./tool-faqs";
import { getToolSeoOverrideKey } from "./tool-seo-overrides";
import { translateToolItem } from "./i18n-tool-labels";

export type ToolPageTranslator = Awaited<ReturnType<typeof getTranslations<"ToolPage">>>;
export type ToolsTranslator = Awaited<ReturnType<typeof getTranslations<"Tools">>>;

const ACTION_KEYS: Record<string, string> = {
  merge: "merge",
  compress: "compress",
  split: "split",
  "batch-rename-pdf": "batchRename",
  "pdf-text-editor": "textEditor",
  "annotate-pdf": "annotate",
  "reorder-pdf-pages": "reorderPages",
  "extract-pdf-pages": "extractPages",
  "compare-pdf": "compare",
  "pdf-to-booklet": "booklet",
  "safe-to-share-auditor": "safeShare",
  "pdf-signature-validator": "pdfSignatureValidator",
  "custom-paper-margin": "paperMargin",
  "delete-pages": "deletePages",
  "add-page-numbers": "pageNumbers",
  "crop-pdf": "crop",
  "crop-image": "crop",
  "resize-image": "resize",
  "convert-to-png": "convert",
  "webp-to-jpg": "convert",
  "svg-to-png": "convert",
  "image-grayscale": "convert",
  "flip-image": "resize",
  "image-metadata-editor": "metadataEditor",
  "image-optimizer": "compress",
  "paint-on-image": "default",
  "rotate-image": "rotate",
  "compress-image": "compress",
  "generate-favicon": "default",
  "png-to-ico": "default",
  "ico-to-png": "default",
  "svg-to-favicon": "default",
  "favicon-pack": "default",
  "apple-touch-icon": "default",
  "favicon-compressor": "default",
  "favicon-cropper": "default",
  "transparent-favicon": "default",
  "favicon-code-generator": "default",
  "favicon-previewer": "default",
  "invoice-generator": "default",
  "data-converter-visualizer": "default",
  "json-formatter": "default",
  "json-to-csv": "default",
  "json-minifier": "default",
  "csv-to-json": "default",
  "base64-encoder-decoder": "default",
  "url-encoder-decoder": "default",
  "text-diff-checker": "default",
  "string-generator": "default",
  "lorem-ipsum-generator": "default",
  "html-markdown-converter": "default",
  "word-character-counter": "default",
  "user-agent-parser": "default",
  "qr-code-generator": "default",
  "jwt-debugger": "default",
  "yaml-json-converter": "default",
  "csv-to-markdown-table": "default",
  "sql-query-formatter": "default",
  "password-generator": "default",
  "hash-generator": "default",
  "uuid-generator": "default",
  "unit-converter": "default",
  "timezone-converter": "default",
  "global-timezone-converter": "default",
  "my-ip": "default",
  "base-converter": "default",
  "storage-data-converter": "default",
  "reading-time-calculator": "default",
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
  "repair-pdf": "repair",
  "pdf-a-converter": "pdfA",
  "pdf-linearization": "pdfLinearize",
  "n-up-pdf": "nUpPdf",
  "grayscale-pdf": "grayscalePdf",
  "remove-hidden-metadata": "removeMetadata",
  "pdf-metadata-editor": "metadataEditor",
  sign: "sign",
  "jpg-to-pdf": "jpgToPdf",
  "png-to-pdf": "pngToPdf",
  "heic-to-pdf": "heicToPdf",
  "heic-to-jpg": "heicToJpg",
  "pdf-to-jpg": "pdfToJpg",
  "pdf-to-png": "pdfToPng",
  "pdf-to-text": "pdfToText",
  "pdf-to-html": "pdfToHtml",
  "pdf-to-epub": "pdfToEpub",
  "pdf-to-xps": "pdfToXps",
  "extract-images": "extractImages",
  "word-to-pdf": "wordToPdf",
  "excel-to-pdf": "excelToPdf",
  "powerpoint-to-pdf": "powerpointToPdf",
  "pdf-to-powerpoint": "pdfToPowerpoint",
  "pdf-to-excel": "pdfToExcel",
  "extract-tables-pdf": "extractTablesPdf",
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

  const overrideKey = !variant ? getToolSeoOverrideKey(tool.slug) : null;

  const p1 =
    overrideKey && t.has(`guide.toolOverrides.${overrideKey}.p1`)
      ? t(`guide.toolOverrides.${overrideKey}.p1`)
      : variant
        ? t("guide.variantP1", { action, keyword: kw, toolTitle })
        : t("guide.defaultP1", { description: tool.description, action });

  const p2 =
    overrideKey && t.has(`guide.toolOverrides.${overrideKey}.p2`)
      ? t(`guide.toolOverrides.${overrideKey}.p2`)
      : t("guide.p2");
  const p3 =
    overrideKey && t.has(`guide.toolOverrides.${overrideKey}.p3`)
      ? t(`guide.toolOverrides.${overrideKey}.p3`)
      : variant?.angle
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
  return buildLocalizedToolFaqs(t, tool, variant, toolTitle, locale);
}
