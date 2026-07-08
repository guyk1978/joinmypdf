import type { ToolPageTranslator } from "./i18n-tool-page";
import type { ToolDefinition, ToolVariant } from "./types";

const SEO_TOOL_SLUGS = ["pdf-merge", "pdf-split", "pdf-compress", "rotate-pdf", "crop-pdf", "delete-pdf-pages", "reorder-pdf-pages", "extract-pdf-pages", "add-page-numbers", "add-watermark", "annotate-pdf", "compare-pdf", "pdf-to-booklet", "batch-rename-pdf", "pdf-text-editor", "custom-paper-margin", "flatten-pdf", "repair-pdf", "pdf-a-converter", "pdf-linearization", "n-up-pdf", "grayscale-pdf", "pdf-metadata-editor", "protect-pdf", "unlock-pdf", "redact-pdf", "safe-to-share-auditor", "remove-hidden-metadata", "sign-pdf", "word-to-pdf", "excel-to-pdf", "powerpoint-to-pdf", "openoffice-to-pdf", "ebook-to-pdf", "iwork-to-pdf", "autocad-to-pdf", "pdf-to-jpg", "pdf-to-png", "pdf-to-text", "pdf-to-html", "extract-images", "pdf-to-word", "pdf-to-excel", "pdf-to-powerpoint", "resize-image", "convert-to-png", "crop-image", "rotate-image", "compress-image", "video-to-mp4", "video-compressor", "video-resizer", "video-rotator", "video-speed-controller", "video-to-gif", "heic-to-jpg", "jpg-to-pdf", "png-to-pdf", "heic-to-pdf", "markdown-to-pdf", "html-to-pdf", "invoice-generator", "data-converter-visualizer", "generate-favicon", "png-to-ico", "ico-to-png", "svg-to-favicon", "favicon-pack", "apple-touch-icon", "favicon-compressor", "favicon-cropper", "transparent-favicon", "favicon-code-generator", "favicon-previewer", "user-agent-parser", "jwt-debugger", "qr-code-generator", "json-formatter", "json-to-csv", "json-minifier", "csv-to-json", "html-markdown-converter"] as const;

export type SeoToolSlug = (typeof SEO_TOOL_SLUGS)[number];

const SLUG_TO_OVERRIDE_KEY: Record<SeoToolSlug, string> = {
  "pdf-merge": "pdfMerge",
  "pdf-split": "pdfSplit",
  "pdf-compress": "pdfCompress",
  "rotate-pdf": "pdfRotate",
  "crop-pdf": "pdfCrop",
  "delete-pdf-pages": "pdfDeletePages",
  "reorder-pdf-pages": "pdfReorderPages",
  "extract-pdf-pages": "pdfExtractPages",
  "add-page-numbers": "pdfAddPageNumbers",
  "add-watermark": "pdfAddWatermark",
  "annotate-pdf": "pdfAnnotate",
  "compare-pdf": "pdfCompare",
  "pdf-to-booklet": "pdfToBooklet",
  "batch-rename-pdf": "pdfBatchRename",
  "pdf-text-editor": "pdfTextEditor",
  "custom-paper-margin": "pdfPaperMargin",
  "flatten-pdf": "pdfFlatten",
  "repair-pdf": "pdfRepair",
  "pdf-a-converter": "pdfAConverter",
  "pdf-linearization": "pdfLinearization",
  "n-up-pdf": "nUpPdf",
  "grayscale-pdf": "grayscalePdf",
  "pdf-metadata-editor": "pdfMetadataEditor",
  "protect-pdf": "pdfProtect",
  "unlock-pdf": "pdfUnlock",
  "redact-pdf": "pdfRedact",
  "safe-to-share-auditor": "pdfSafeShareAuditor",
  "remove-hidden-metadata": "pdfRemoveMetadata",
  "sign-pdf": "pdfSign",
  "word-to-pdf": "wordToPdf",
  "excel-to-pdf": "excelToPdf",
  "powerpoint-to-pdf": "powerpointToPdf",
  "openoffice-to-pdf": "openofficeToPdf",
  "ebook-to-pdf": "ebookToPdf",
  "iwork-to-pdf": "iworkToPdf",
  "autocad-to-pdf": "autocadToPdf",
  "pdf-to-jpg": "pdfToJpg",
  "pdf-to-png": "pdfToPng",
  "pdf-to-text": "pdfToText",
  "pdf-to-html": "pdfToHtml",
  "extract-images": "extractImages",
  "pdf-to-word": "pdfToWord",
  "pdf-to-excel": "pdfToExcel",
  "pdf-to-powerpoint": "pdfToPowerpoint",
  "resize-image": "resizeImage",
  "convert-to-png": "convertToPng",
  "crop-image": "cropImage",
  "rotate-image": "rotateImage",
  "compress-image": "compressImage",
  "video-to-mp4": "videoToMp4",
  "video-compressor": "videoCompressor",
  "video-resizer": "videoResizer",
  "video-rotator": "videoRotator",
  "video-speed-controller": "videoSpeedController",
  "video-to-gif": "videoToGif",
  "heic-to-jpg": "heicToJpg",
  "jpg-to-pdf": "jpgToPdf",
  "png-to-pdf": "pngToPdf",
  "heic-to-pdf": "heicToPdf",
  "markdown-to-pdf": "markdownToPdf",
  "html-to-pdf": "htmlToPdf",
  "invoice-generator": "invoiceGenerator",
  "data-converter-visualizer": "dataConverterVisualizer",
  "generate-favicon": "generateFavicon",
  "png-to-ico": "pngToIco",
  "ico-to-png": "icoToPng",
  "svg-to-favicon": "svgToFavicon",
  "favicon-pack": "faviconPack",
  "apple-touch-icon": "appleTouchIcon",
  "favicon-compressor": "faviconCompressor",
  "favicon-cropper": "faviconCropper",
  "transparent-favicon": "transparentFavicon",
  "favicon-code-generator": "faviconCodeGenerator",
  "favicon-previewer": "faviconPreviewer",
  "user-agent-parser": "userAgentParser",
  "jwt-debugger": "jwtDebugger",
  "qr-code-generator": "qrCodeGenerator",
  "json-formatter": "jsonFormatter",
  "json-to-csv": "jsonToCsv",
  "json-minifier": "jsonMinifier",
  "csv-to-json": "csvToJson",
  "html-markdown-converter": "htmlMarkdownConverter",
};

const COMPLEMENTARY_TOOL_HREF: Partial<Record<SeoToolSlug, string>> = {
  "pdf-merge": "/tools/pdf-split/",
  "pdf-split": "/tools/pdf-merge/",
  "pdf-to-word": "/tools/word-to-pdf/",
  "word-to-pdf": "/tools/pdf-to-word/",
  "pdf-to-excel": "/tools/excel-to-pdf/",
  "excel-to-pdf": "/tools/pdf-to-excel/",
  "pdf-to-powerpoint": "/tools/powerpoint-to-pdf/",
  "powerpoint-to-pdf": "/tools/pdf-to-powerpoint/",
};

export type ToolSeoBenefitCard = {
  icon: string;
  title: string;
  body: string;
};

export type ToolSeoPageOverride = {
  slug: SeoToolSlug;
  overrideKey: string;
  h1: string;
  heroTagline?: string;
  introSectionTitle: string;
  whySectionTitle: string;
  whySectionSubheadline?: string;
  whyBenefits?: ToolSeoBenefitCard[];
  schemaDescription: string;
  featuredGuide?: {
    slug: string;
    label: string;
  };
  complementaryTool?: {
    href: string;
    prompt: string;
    linkLabel: string;
  };
  relatedWorkflowLinks?: {
    prompt: string;
    links: { href: string; label: string }[];
  };
};

const WHY_BENEFIT_ICONS = {
  lossless: "🎯",
  quality: "✨",
  local: "⚡",
} as const;

function readWhyBenefits(t: ToolPageTranslator, base: string): ToolSeoBenefitCard[] | undefined {
  const ids = Object.keys(WHY_BENEFIT_ICONS) as (keyof typeof WHY_BENEFIT_ICONS)[];
  if (!t.has(`${base}.whyBenefits.lossless.title`)) return undefined;

  return ids.map((id) => ({
    icon: WHY_BENEFIT_ICONS[id],
    title: t(`${base}.whyBenefits.${id}.title`),
    body: t(`${base}.whyBenefits.${id}.body`),
  }));
}

export function resolveToolSeoPageOverride(
  tool: ToolDefinition,
  variant: ToolVariant | null,
  t: ToolPageTranslator,
): ToolSeoPageOverride | null {
  if (variant) return null;
  if (!SEO_TOOL_SLUGS.includes(tool.slug as SeoToolSlug)) return null;

  const slug = tool.slug as SeoToolSlug;
  const key = SLUG_TO_OVERRIDE_KEY[slug];
  const base = `toolSeo.${key}`;

  if (!t.has(`${base}.h1`)) return null;

  const complementaryHref = COMPLEMENTARY_TOOL_HREF[slug];
  const complementaryTool =
    complementaryHref &&
    t.has(`${base}.complementaryTool.prompt`) &&
    t.has(`${base}.complementaryTool.linkLabel`)
      ? {
          href: complementaryHref,
          prompt: t(`${base}.complementaryTool.prompt`),
          linkLabel: t(`${base}.complementaryTool.linkLabel`),
        }
      : undefined;

  const featuredGuide =
    t.has(`${base}.featuredGuide.slug`) && t.has(`${base}.featuredGuide.label`)
      ? {
          slug: t(`${base}.featuredGuide.slug`),
          label: t(`${base}.featuredGuide.label`),
        }
      : undefined;

  const workflowLinkDefs = [
    { href: "/tools/pdf-merge/", labelKey: "mergeLabel" },
    { href: "/tools/pdf-split/", labelKey: "splitLabel" },
    { href: "/tools/rotate-pdf/", labelKey: "rotateLabel" },
    { href: "/tools/pdf-compress/", labelKey: "compressLabel" },
    { href: "/tools/delete-pdf-pages/", labelKey: "deleteLabel" },
    { href: "/tools/reorder-pdf-pages/", labelKey: "reorderLabel" },
    { href: "/tools/add-page-numbers/", labelKey: "pageNumbersLabel" },
    { href: "/tools/add-watermark/", labelKey: "watermarkLabel" },
    { href: "/tools/annotate-pdf/", labelKey: "annotateLabel" },
    { href: "/tools/crop-pdf/", labelKey: "cropLabel" },
    { href: "/tools/pdf-to-booklet/", labelKey: "bookletLabel" },
    { href: "/tools/flatten-pdf/", labelKey: "flattenLabel" },
    { href: "/tools/pdf-a-converter/", labelKey: "pdfAConverterLabel" },
    { href: "/tools/pdf-linearization/", labelKey: "pdfLinearizationLabel" },
    { href: "/tools/n-up-pdf/", labelKey: "nUpPdfLabel" },
    { href: "/tools/grayscale-pdf/", labelKey: "grayscalePdfLabel" },
    { href: "/tools/redact-pdf/", labelKey: "redactLabel" },
    { href: "/tools/safe-to-share-auditor/", labelKey: "auditorLabel" },
    { href: "/tools/remove-hidden-metadata/", labelKey: "removeMetadataLabel" },
    { href: "/tools/pdf-metadata-editor/", labelKey: "pdfMetadataEditorLabel" },
    { href: "/tools/protect-pdf/", labelKey: "protectLabel" },
    { href: "/tools/unlock-pdf/", labelKey: "unlockLabel" },
    { href: "/tools/pdf-to-png/", labelKey: "pngLabel" },
    { href: "/tools/pdf-to-jpg/", labelKey: "jpgLabel" },
    { href: "/tools/crop-image/", labelKey: "cropImageLabel" },
    { href: "/tools/word-to-pdf/", labelKey: "wordToPdfLabel" },
    { href: "/tools/pdf-to-text/", labelKey: "pdfToTextLabel" },
    { href: "/tools/pdf-to-html/", labelKey: "pdfToHtmlLabel" },
    { href: "/tools/compress-image/", labelKey: "compressImageLabel" },
    { href: "/tools/resize-image/", labelKey: "resizeImageLabel" },
    { href: "/tools/convert-to-png/", labelKey: "convertToPngLabel" },
    { href: "/tools/jpg-to-pdf/", labelKey: "jpgToPdfLabel" },
    { href: "/tools/heic-to-jpg/", labelKey: "heicToJpgLabel" },
    { href: "/tools/json-formatter/", labelKey: "jsonFormatterLabel" },
    { href: "/tools/json-to-csv/", labelKey: "jsonToCsvLabel" },
    { href: "/tools/jwt-debugger/", labelKey: "jwtDebuggerLabel" },
    { href: "/tools/base64-encoder-decoder/", labelKey: "base64EncoderDecoderLabel" },
    { href: "/tools/user-agent-parser/", labelKey: "userAgentParserLabel" },
    { href: "/tools/pdf-to-excel/", labelKey: "pdfToExcelLabel" },
    { href: "/tools/qr-code-generator/", labelKey: "qrCodeGeneratorLabel" },
    { href: "/tools/generate-favicon/", labelKey: "generateFaviconLabel" },
    { href: "/tools/png-to-ico/", labelKey: "pngToIcoLabel" },
    { href: "/tools/favicon-pack/", labelKey: "faviconPackLabel" },
    { href: "/tools/favicon-cropper/", labelKey: "faviconCropperLabel" },
    { href: "/tools/html-markdown-converter/", labelKey: "htmlMarkdownConverterLabel" },
    { href: "/tools/favicon-code-generator/", labelKey: "faviconCodeGeneratorLabel" },
    { href: "/tools/favicon-compressor/", labelKey: "faviconCompressorLabel" },
    { href: "/tools/markdown-to-pdf/", labelKey: "markdownToPdfLabel" },
    { href: "/tools/html-to-pdf/", labelKey: "htmlToPdfLabel" },
    { href: "/tools/csv-to-json/", labelKey: "csvToJsonLabel" },
  ] as const;

  const workflowLinks = workflowLinkDefs
    .filter((def) => t.has(`${base}.relatedWorkflowLinks.${def.labelKey}`))
    .map((def) => ({
      href: def.href,
      label: t(`${base}.relatedWorkflowLinks.${def.labelKey}`),
    }));

  const relatedWorkflowLinks =
    t.has(`${base}.relatedWorkflowLinks.prompt`) && workflowLinks.length > 0
      ? {
          prompt: t(`${base}.relatedWorkflowLinks.prompt`),
          links: workflowLinks,
        }
      : undefined;

  return {
    slug,
    overrideKey: key,
    h1: t(`${base}.h1`),
    heroTagline: t.has(`${base}.heroTagline`) ? t(`${base}.heroTagline`) : undefined,
    introSectionTitle: t(`${base}.introSectionTitle`),
    whySectionTitle: t(`${base}.whySectionTitle`),
    whySectionSubheadline: t.has(`${base}.whySectionSubheadline`)
      ? t(`${base}.whySectionSubheadline`)
      : undefined,
    whyBenefits: readWhyBenefits(t, base),
    schemaDescription: t(`${base}.schemaDescription`),
    featuredGuide,
    complementaryTool,
    relatedWorkflowLinks,
  };
}
