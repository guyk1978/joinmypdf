import type { getTranslations } from "next-intl/server";
import type { ToolDefinition, ToolVariant } from "./types";
import { buildLocalizedToolFaqs } from "./tool-faqs";
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
  "custom-paper-margin": "paperMargin",
  "delete-pages": "deletePages",
  "add-page-numbers": "pageNumbers",
  "crop-pdf": "crop",
  "crop-image": "crop",
  "resize-image": "resize",
  "convert-to-png": "convert",
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

  const overrideKey =
    !variant && tool.slug === "pdf-merge"
      ? "pdfMerge"
      : !variant && tool.slug === "pdf-split"
        ? "pdfSplit"
        : !variant && tool.slug === "pdf-compress"
          ? "pdfCompress"
          : !variant && tool.slug === "rotate-pdf"
            ? "pdfRotate"
            : !variant && tool.slug === "crop-pdf"
              ? "pdfCrop"
              : !variant && tool.slug === "delete-pdf-pages"
                ? "pdfDeletePages"
                : !variant && tool.slug === "reorder-pdf-pages"
                  ? "pdfReorderPages"
                  : !variant && tool.slug === "extract-pdf-pages"
                    ? "pdfExtractPages"
                    : !variant && tool.slug === "add-page-numbers"
                      ? "pdfAddPageNumbers"
                      : !variant && tool.slug === "add-watermark"
                        ? "pdfAddWatermark"
                        : !variant && tool.slug === "annotate-pdf"
                          ? "pdfAnnotate"
                          : !variant && tool.slug === "compare-pdf"
                            ? "pdfCompare"
                            : !variant && tool.slug === "pdf-to-booklet"
                              ? "pdfToBooklet"
                              : !variant && tool.slug === "batch-rename-pdf"
                                ? "pdfBatchRename"
                                : !variant && tool.slug === "pdf-text-editor"
                                  ? "pdfTextEditor"
                                  : !variant && tool.slug === "custom-paper-margin"
                                    ? "pdfPaperMargin"
                                    : !variant && tool.slug === "flatten-pdf"
                                      ? "pdfFlatten"
                                      : !variant && tool.slug === "repair-pdf"
                                        ? "pdfRepair"
                                        : !variant && tool.slug === "pdf-a-converter"
                                          ? "pdfAConverter"
                                          : !variant && tool.slug === "pdf-linearization"
                                            ? "pdfLinearization"
                                            : !variant && tool.slug === "n-up-pdf"
                                              ? "nUpPdf"
                                              : !variant && tool.slug === "grayscale-pdf"
                                                ? "grayscalePdf"
                                                : !variant && tool.slug === "protect-pdf"
                                          ? "pdfProtect"
                                          : !variant && tool.slug === "unlock-pdf"
                                            ? "pdfUnlock"
                                            : !variant && tool.slug === "redact-pdf"
                                              ? "pdfRedact"
                                              : !variant && tool.slug === "safe-to-share-auditor"
                                                ? "pdfSafeShareAuditor"
                                                : !variant && tool.slug === "remove-hidden-metadata"
                                                  ? "pdfRemoveMetadata"
                                                  : !variant && tool.slug === "pdf-metadata-editor"
                                                    ? "pdfMetadataEditor"
                                                    : !variant && tool.slug === "sign-pdf"
                                                    ? "pdfSign"
                                                    : !variant && tool.slug === "word-to-pdf"
                                                      ? "wordToPdf"
                                                      : !variant && tool.slug === "excel-to-pdf"
                                                        ? "excelToPdf"
                                                        : !variant && tool.slug === "powerpoint-to-pdf"
                                                          ? "powerpointToPdf"
                                                          : !variant && tool.slug === "openoffice-to-pdf"
                                                            ? "openofficeToPdf"
                                                            : !variant && tool.slug === "ebook-to-pdf"
                                                              ? "ebookToPdf"
                                                              : !variant && tool.slug === "iwork-to-pdf"
                                                                ? "iworkToPdf"
                                                                : !variant && tool.slug === "autocad-to-pdf"
                                                                  ? "autocadToPdf"
                                                                  : !variant && tool.slug === "pdf-to-jpg"
                                                                    ? "pdfToJpg"
                                                                    : !variant && tool.slug === "pdf-to-png"
                                                                      ? "pdfToPng"
                                                                      : !variant && tool.slug === "pdf-to-text"
                                                                        ? "pdfToText"
                                                                        : !variant && tool.slug === "pdf-to-html"
                                                                          ? "pdfToHtml"
                                                                          : !variant && tool.slug === "extract-images"
                                                                          ? "extractImages"
                                                                          : !variant && tool.slug === "pdf-to-word"
                                                                            ? "pdfToWord"
                                                                            : !variant && tool.slug === "pdf-to-excel"
                                                                              ? "pdfToExcel"
                                                                              : !variant && tool.slug === "pdf-to-powerpoint"
                                                                                ? "pdfToPowerpoint"
                                                                                : !variant && tool.slug === "resize-image"
                                                                                  ? "resizeImage"
                                                                                  : !variant && tool.slug === "convert-to-png"
                                                                                    ? "convertToPng"
                                                                                    : !variant && tool.slug === "crop-image"
                                                                                      ? "cropImage"
                                                                                      : !variant && tool.slug === "rotate-image"
                                                                                        ? "rotateImage"
                                                                                        : !variant && tool.slug === "compress-image"
                                                                                          ? "compressImage"
                                                                                          : !variant && tool.slug === "heic-to-jpg"
                                                                                            ? "heicToJpg"
                                                                                            : !variant && tool.slug === "jpg-to-pdf"
                                                                                              ? "jpgToPdf"
                                                                                              : !variant && tool.slug === "png-to-pdf"
                                                                                                ? "pngToPdf"
                                                                                                : !variant && tool.slug === "heic-to-pdf"
                                                                                                  ? "heicToPdf"
                                                                                                  : !variant && tool.slug === "user-agent-parser"
                                                                                                    ? "userAgentParser"
                                                                                                    : !variant && tool.slug === "jwt-debugger"
                                                                                                      ? "jwtDebugger"
                                                                                                      : !variant && tool.slug === "qr-code-generator"
                                                                                                        ? "qrCodeGenerator"
                                                                                                        : !variant && tool.slug === "json-formatter"
                                                                                                          ? "jsonFormatter"
                                                                                                          : !variant && tool.slug === "json-to-csv"
                                                                                                            ? "jsonToCsv"
                                                                                                            : !variant && tool.slug === "json-minifier"
                                                                                                              ? "jsonMinifier"
                                                                                                              : !variant && tool.slug === "csv-to-json"
                                                                                                                ? "csvToJson"
                                                                                                                : !variant && tool.slug === "html-markdown-converter"
                                                                                                                  ? "htmlMarkdownConverter"
                                                                                                                  : !variant && tool.slug === "generate-favicon"
                                                                                                                    ? "generateFavicon"
                                                                                                                    : !variant && tool.slug === "png-to-ico"
                                                                                                                      ? "pngToIco"
                                                                                                                      : !variant && tool.slug === "ico-to-png"
                                                                                                                        ? "icoToPng"
                                                                                                                        : !variant && tool.slug === "svg-to-favicon"
                                                                                                                          ? "svgToFavicon"
                                                                                                                          : !variant && tool.slug === "favicon-pack"
                                                                                                                            ? "faviconPack"
                                                                                                                            : !variant && tool.slug === "apple-touch-icon"
                                                                                                                              ? "appleTouchIcon"
                                                                                                                              : !variant && tool.slug === "favicon-compressor"
                                                                                                                                ? "faviconCompressor"
                                                                                                                                : !variant && tool.slug === "favicon-cropper"
                                                                                                                                  ? "faviconCropper"
                                                                                                                                  : !variant && tool.slug === "transparent-favicon"
                                                                                                                                    ? "transparentFavicon"
                                                                                                                                    : !variant && tool.slug === "favicon-code-generator"
                                                                                                                                      ? "faviconCodeGenerator"
                                                                                                                                      : !variant && tool.slug === "favicon-previewer"
                                                                                                                                        ? "faviconPreviewer"
                                                                                                                                        : !variant && tool.slug === "markdown-to-pdf"
                                                                                                                                          ? "markdownToPdf"
                                                                                                                                          : !variant && tool.slug === "html-to-pdf"
                                                                                                                                            ? "htmlToPdf"
                                                                                                                                            : !variant && tool.slug === "invoice-generator"
                                                                                                                                              ? "invoiceGenerator"
                                                                                                                                              : !variant && tool.slug === "data-converter-visualizer"
                                                                                                                                                ? "dataConverterVisualizer"
                                                                                                                                                : null;

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
