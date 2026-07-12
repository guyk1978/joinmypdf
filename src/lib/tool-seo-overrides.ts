import type { ToolPageTranslator } from "./i18n-tool-page";
import type { ToolDefinition, ToolVariant } from "./types";

/** Fifteen tools identified in the SEO audit as missing rich page overrides. */
export const MISSING_SEO_OVERRIDE_CANDIDATES = [
  { slug: "pdf-password-recovery", overrideKey: "pdfPasswordRecovery" },
  { slug: "base64-encoder-decoder", overrideKey: "base64EncoderDecoder" },
  { slug: "url-encoder-decoder", overrideKey: "urlEncoderDecoder" },
  { slug: "text-diff-checker", overrideKey: "textDiffChecker" },
  { slug: "string-generator", overrideKey: "stringGenerator" },
  { slug: "word-character-counter", overrideKey: "wordCharacterCounter" },
  { slug: "yaml-json-converter", overrideKey: "yamlJsonConverter" },
  { slug: "csv-to-markdown-table", overrideKey: "csvToMarkdownTable" },
  { slug: "sql-query-formatter", overrideKey: "sqlQueryFormatter" },
  { slug: "password-generator", overrideKey: "passwordGenerator" },
  { slug: "hash-generator", overrideKey: "hashGenerator" },
  { slug: "uuid-generator", overrideKey: "uuidGenerator" },
  { slug: "unit-converter", overrideKey: "unitConverter" },
  { slug: "timezone-converter", overrideKey: "timezoneConverter" },
  { slug: "reading-time-calculator", overrideKey: "readingTimeCalculator" },
] as const;

export type MissingSeoOverrideCandidate = (typeof MISSING_SEO_OVERRIDE_CANDIDATES)[number];

export type ToolSeoBoilerplateTemplate = {
  h1: string;
  heroTagline: string;
  introSectionTitle: string;
  whySectionTitle: string;
  whySectionSubheadline: string;
  schemaDescription: string;
  whyBenefits: Record<
    "lossless" | "quality" | "local",
    {
      title: string;
      body: string;
    }
  >;
};

/** Generates default SEO copy fields for locale-extension `toolSeo.{overrideKey}` blocks. */
export function buildBoilerplateToolSeoStructure(input: {
  title: string;
  primaryKeyword: string;
  intent: string;
}): ToolSeoBoilerplateTemplate {
  const { title, primaryKeyword, intent } = input;
  const intentSentence = intent.replace(/\.$/, "");

  const schemaLead = primaryKeyword.toLowerCase().includes("online")
    ? `${primaryKeyword} for free`
    : `${primaryKeyword} online for free`;

  return {
    h1: `Free ${title} Online`,
    heroTagline: `${intentSentence}.`,
    introSectionTitle: `How to Use ${title}`,
    whySectionTitle: `Why Use Our ${title}?`,
    whySectionSubheadline: `Secure local-only processing, privacy-first ${primaryKeyword}, and instant results in your browser—no uploads or account required.`,
    schemaDescription: `${schemaLead}—${title.toLowerCase()} in your browser. 100% client-side with no data logging.`,
    whyBenefits: {
      lossless: {
        title: "100% Client-side (no data leaves your browser)",
        body: `Secure local-only processing—${intentSentence.toLowerCase()} without cloud services that store your inputs.`,
      },
      quality: {
        title: "Fast, precise results",
        body: `Purpose-built for ${primaryKeyword} with clear output you can copy or download instantly.`,
      },
      local: {
        title: "Privacy-first tool",
        body: "No server uploads, no tracking on your content, and no account required for everyday use.",
      },
    },
  };
}

const SEO_TOOL_SLUGS = ["pdf-merge", "pdf-split", "pdf-compress", "rotate-pdf", "crop-pdf", "delete-pdf-pages", "reorder-pdf-pages", "extract-pdf-pages", "add-page-numbers", "add-watermark", "annotate-pdf", "compare-pdf", "pdf-to-booklet", "batch-rename-pdf", "pdf-text-editor", "custom-paper-margin", "flatten-pdf", "repair-pdf", "pdf-a-converter", "pdf-linearization", "n-up-pdf", "grayscale-pdf", "pdf-metadata-editor", "protect-pdf", "unlock-pdf", "redact-pdf", "safe-to-share-auditor", "remove-hidden-metadata", "sign-pdf", "pdf-signature-validator", "word-to-pdf", "excel-to-pdf", "powerpoint-to-pdf", "openoffice-to-pdf", "ebook-to-pdf", "iwork-to-pdf", "autocad-to-pdf", "pdf-to-jpg", "pdf-to-png", "pdf-to-text", "pdf-to-html", "pdf-to-epub", "pdf-to-xps", "extract-images", "pdf-to-word", "pdf-to-excel", "extract-tables-pdf", "pdf-to-powerpoint", "resize-image", "convert-to-png", "crop-image", "rotate-image", "compress-image", "video-to-mp4", "video-converter", "video-compressor", "video-resizer", "video-rotator", "video-speed-controller", "video-speed", "video-to-gif", "video-trimmer", "video-to-mp3", "video-muter", "video-metadata-cleaner", "heic-to-jpg", "webp-to-jpg", "svg-to-png", "image-grayscale", "flip-image", "image-metadata-editor", "image-optimizer", "paint-on-image", "jpg-to-pdf", "png-to-pdf", "heic-to-pdf", "markdown-to-pdf", "html-to-pdf", "invoice-generator", "data-converter-visualizer", "generate-favicon", "png-to-ico", "ico-to-png", "svg-to-favicon", "favicon-pack", "apple-touch-icon", "favicon-compressor", "favicon-cropper", "transparent-favicon", "favicon-code-generator", "favicon-previewer", "user-agent-parser", "jwt-debugger", "qr-code-generator", "json-formatter", "json-to-csv", "json-minifier", "csv-to-json", "html-markdown-converter", "pdf-password-recovery", "base64-encoder-decoder", "url-encoder-decoder", "text-diff-checker", "string-generator", "word-character-counter", "yaml-json-converter", "csv-to-markdown-table", "sql-query-formatter", "password-generator", "hash-generator", "uuid-generator", "unit-converter", "timezone-converter", "reading-time-calculator"] as const;

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
  "pdf-signature-validator": "pdfSignatureValidator",
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
  "pdf-to-epub": "pdfToEpub",
  "pdf-to-xps": "pdfToXps",
  "extract-images": "extractImages",
  "pdf-to-word": "pdfToWord",
  "pdf-to-excel": "pdfToExcel",
  "extract-tables-pdf": "extractTablesPdf",
  "pdf-to-powerpoint": "pdfToPowerpoint",
  "resize-image": "resizeImage",
  "convert-to-png": "convertToPng",
  "crop-image": "cropImage",
  "rotate-image": "rotateImage",
  "compress-image": "compressImage",
  "video-to-mp4": "videoToMp4",
  "video-converter": "videoConverter",
  "video-compressor": "videoCompressor",
  "video-resizer": "videoResizer",
  "video-rotator": "videoRotator",
  "video-speed-controller": "videoSpeedController",
  "video-speed": "videoSpeed",
  "video-to-gif": "videoToGif",
  "video-trimmer": "videoTrimmer",
  "video-to-mp3": "videoToMp3",
  "video-muter": "videoMuter",
  "video-metadata-cleaner": "videoMetadataCleaner",
  "heic-to-jpg": "heicToJpg",
  "webp-to-jpg": "webpToJpg",
  "svg-to-png": "svgToPng",
  "image-grayscale": "imageGrayscale",
  "flip-image": "flipImage",
  "image-metadata-editor": "imageMetadataEditor",
  "image-optimizer": "imageOptimizer",
  "paint-on-image": "paintOnImage",
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
  "pdf-password-recovery": "pdfPasswordRecovery",
  "base64-encoder-decoder": "base64EncoderDecoder",
  "url-encoder-decoder": "urlEncoderDecoder",
  "text-diff-checker": "textDiffChecker",
  "string-generator": "stringGenerator",
  "word-character-counter": "wordCharacterCounter",
  "yaml-json-converter": "yamlJsonConverter",
  "csv-to-markdown-table": "csvToMarkdownTable",
  "sql-query-formatter": "sqlQueryFormatter",
  "password-generator": "passwordGenerator",
  "hash-generator": "hashGenerator",
  "uuid-generator": "uuidGenerator",
  "unit-converter": "unitConverter",
  "timezone-converter": "timezoneConverter",
  "reading-time-calculator": "readingTimeCalculator",
};

export function getToolSeoOverrideKey(slug: string): string | null {
  if (!SEO_TOOL_SLUGS.includes(slug as SeoToolSlug)) return null;
  return SLUG_TO_OVERRIDE_KEY[slug as SeoToolSlug];
}

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
    { href: "/tools/pdf-to-epub/", labelKey: "pdfToEpubLabel" },
    { href: "/tools/pdf-to-xps/", labelKey: "pdfToXpsLabel" },
    { href: "/tools/compress-image/", labelKey: "compressImageLabel" },
    { href: "/tools/resize-image/", labelKey: "resizeImageLabel" },
    { href: "/tools/rotate-image/", labelKey: "rotateImageLabel" },
    { href: "/tools/image-optimizer/", labelKey: "imageOptimizerLabel" },
    { href: "/tools/convert-to-png/", labelKey: "convertToPngLabel" },
    { href: "/tools/jpg-to-pdf/", labelKey: "jpgToPdfLabel" },
    { href: "/tools/heic-to-jpg/", labelKey: "heicToJpgLabel" },
    { href: "/tools/json-formatter/", labelKey: "jsonFormatterLabel" },
    { href: "/tools/json-to-csv/", labelKey: "jsonToCsvLabel" },
    { href: "/tools/jwt-debugger/", labelKey: "jwtDebuggerLabel" },
    { href: "/tools/base64-encoder-decoder/", labelKey: "base64EncoderDecoderLabel" },
    { href: "/tools/user-agent-parser/", labelKey: "userAgentParserLabel" },
    { href: "/tools/pdf-to-excel/", labelKey: "pdfToExcelLabel" },
    { href: "/tools/extract-tables-pdf/", labelKey: "extractTablesPdfLabel" },
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
