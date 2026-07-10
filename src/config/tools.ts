/**
 * Central tool registry — single source of truth for Header nav and Footer tools panel.
 *
 * When adding a new tool:
 * 1. Add one entry to TOOL_DEFINITIONS with slug, labelKey, and categories.
 * 2. Header + Footer update automatically — no manual link lists elsewhere.
 */

export const TOOL_CATEGORIES = {
  compress: "compress",
  pdfEdit: "pdf-edit",
  pdfSecurity: "pdf-security",
  pdfConvertIn: "pdf-convert-in",
  pdfExport: "pdf-export",
  image: "image",
  video: "video",
  favicon: "favicon",
  developerBrowser: "developer-browser",
  developerTokens: "developer-tokens",
  developerGenerators: "developer-generators",
  developerJson: "developer-json",
  developerPublish: "developer-publish",
  developerWorkflows: "developer-workflows",
  utilitiesEncoders: "utilities-encoders",
  utilitiesText: "utilities-text",
  dataConversion: "dataConversion",
  security: "security",
  productivity: "productivity",
} as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES];

export type ToolDefinition = {
  slug: string;
  /** Key under Header.navItems */
  labelKey: string;
  categories: ToolCategory[];
};

export function toolPath(slug: string): string {
  return `/tools/${slug}/`;
}

const c = TOOL_CATEGORIES;

/** All site tools — add new tools here only. */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // Compress (also appears in their primary nav group)
  { slug: "pdf-compress", labelKey: "compressPdf", categories: [c.compress, c.pdfEdit] },
  { slug: "compress-image", labelKey: "compressImage", categories: [c.compress, c.image] },
  { slug: "video-compressor", labelKey: "videoCompressor", categories: [c.compress, c.video] },
  { slug: "favicon-compressor", labelKey: "faviconCompressor", categories: [c.compress, c.favicon] },

  // PDF — Edit & organize
  { slug: "pdf-merge", labelKey: "mergePdf", categories: [c.pdfEdit] },
  { slug: "pdf-split", labelKey: "splitPdf", categories: [c.pdfEdit] },
  { slug: "rotate-pdf", labelKey: "rotatePdf", categories: [c.pdfEdit] },
  { slug: "crop-pdf", labelKey: "cropPdf", categories: [c.pdfEdit] },
  { slug: "delete-pdf-pages", labelKey: "deletePdfPages", categories: [c.pdfEdit] },
  { slug: "reorder-pdf-pages", labelKey: "reorderPdfPages", categories: [c.pdfEdit] },
  { slug: "extract-pdf-pages", labelKey: "extractPdfPages", categories: [c.pdfEdit] },
  { slug: "add-page-numbers", labelKey: "addPageNumbers", categories: [c.pdfEdit] },
  { slug: "add-watermark", labelKey: "addWatermark", categories: [c.pdfEdit] },
  { slug: "annotate-pdf", labelKey: "annotatePdf", categories: [c.pdfEdit] },
  { slug: "compare-pdf", labelKey: "comparePdf", categories: [c.pdfEdit] },
  { slug: "pdf-to-booklet", labelKey: "pdfToBooklet", categories: [c.pdfEdit] },
  { slug: "batch-rename-pdf", labelKey: "batchRenamePdf", categories: [c.pdfEdit] },
  { slug: "pdf-text-editor", labelKey: "pdfTextEditor", categories: [c.pdfEdit] },
  { slug: "custom-paper-margin", labelKey: "customPaperMargin", categories: [c.pdfEdit] },
  { slug: "flatten-pdf", labelKey: "flattenPdf", categories: [c.pdfEdit] },
  { slug: "repair-pdf", labelKey: "repairPdf", categories: [c.pdfEdit] },
  { slug: "pdf-metadata-editor", labelKey: "pdfMetadataEditor", categories: [c.pdfEdit] },
  /** Convert standard PDFs to archival PDF/A for records compliance. */
  { slug: "pdf-a-converter", labelKey: "pdfAConverter", categories: [c.pdfExport] },
  /** Linearize PDFs for Fast Web View and progressive browser loading. */
  { slug: "pdf-linearization", labelKey: "pdfLinearization", categories: [c.pdfExport] },
  /** Arrange multiple PDF pages per sheet (N-Up imposition). */
  { slug: "n-up-pdf", labelKey: "nUpPdf", categories: [c.pdfExport] },
  /** Convert color PDFs to grayscale for print and archival optimization. */
  { slug: "grayscale-pdf", labelKey: "grayscalePdf", categories: [c.pdfExport] },

  // PDF — Security
  { slug: "protect-pdf", labelKey: "protectPdf", categories: [c.pdfSecurity] },
  { slug: "unlock-pdf", labelKey: "unlockPdf", categories: [c.pdfSecurity] },
  { slug: "pdf-password-recovery", labelKey: "pdfPasswordRecovery", categories: [c.pdfSecurity] },
  { slug: "redact-pdf", labelKey: "redactPdf", categories: [c.pdfSecurity] },
  { slug: "safe-to-share-auditor", labelKey: "safeToShareAuditor", categories: [c.pdfSecurity] },
  { slug: "remove-hidden-metadata", labelKey: "removeHiddenMetadata", categories: [c.pdfSecurity] },
  { slug: "sign-pdf", labelKey: "signPdf", categories: [c.pdfSecurity] },
  /** Verify PKCS#7 digital signatures and document integrity locally. */
  { slug: "pdf-signature-validator", labelKey: "pdfSignatureValidator", categories: [c.pdfSecurity] },

  // PDF — Convert to PDF
  { slug: "word-to-pdf", labelKey: "wordToPdf", categories: [c.pdfConvertIn] },
  { slug: "excel-to-pdf", labelKey: "excelToPdf", categories: [c.pdfConvertIn] },
  { slug: "powerpoint-to-pdf", labelKey: "powerpointToPdf", categories: [c.pdfConvertIn] },
  { slug: "openoffice-to-pdf", labelKey: "openofficeToPdf", categories: [c.pdfConvertIn] },
  { slug: "ebook-to-pdf", labelKey: "ebookToPdf", categories: [c.pdfConvertIn] },
  { slug: "iwork-to-pdf", labelKey: "iworkToPdf", categories: [c.pdfConvertIn] },
  { slug: "autocad-to-pdf", labelKey: "autocadToPdf", categories: [c.pdfConvertIn] },

  // PDF — Export from PDF
  { slug: "pdf-to-jpg", labelKey: "pdfToJpg", categories: [c.pdfExport] },
  { slug: "pdf-to-png", labelKey: "pdfToPng", categories: [c.pdfExport] },
  { slug: "pdf-to-text", labelKey: "pdfToText", categories: [c.pdfExport] },
  { slug: "pdf-to-html", labelKey: "pdfToHtml", categories: [c.pdfExport] },
  { slug: "pdf-to-epub", labelKey: "pdfToEpub", categories: [c.pdfExport] },
  /** Convert PDFs to XPS for Windows-centric document archiving and sharing. */
  { slug: "pdf-to-xps", labelKey: "pdfToXps", categories: [c.pdfExport] },
  { slug: "extract-images", labelKey: "extractImages", categories: [c.pdfExport] },
  { slug: "pdf-to-word", labelKey: "pdfToWord", categories: [c.pdfExport] },
  { slug: "pdf-to-excel", labelKey: "pdfToExcel", categories: [c.pdfExport] },
  /** Extract aligned tabular regions from PDFs into CSV or Excel. */
  { slug: "extract-tables-pdf", labelKey: "extractTablesPdf", categories: [c.pdfExport] },
  { slug: "pdf-to-powerpoint", labelKey: "pdfToPowerpoint", categories: [c.pdfExport] },

  // Image
  { slug: "resize-image", labelKey: "resizeImage", categories: [c.image] },
  { slug: "convert-to-png", labelKey: "convertToPng", categories: [c.image] },
  { slug: "crop-image", labelKey: "cropImage", categories: [c.image] },
  { slug: "rotate-image", labelKey: "rotateImage", categories: [c.image] },
  { slug: "heic-to-jpg", labelKey: "heicToJpg", categories: [c.image] },
  { slug: "webp-to-jpg", labelKey: "webpToJpg", categories: [c.image] },
  { slug: "svg-to-png", labelKey: "svgToPng", categories: [c.image] },
  { slug: "image-grayscale", labelKey: "imageGrayscale", categories: [c.image] },
  { slug: "flip-image", labelKey: "flipImage", categories: [c.image] },
  { slug: "image-metadata-editor", labelKey: "imageMetadataEditor", categories: [c.image] },
  { slug: "image-optimizer", labelKey: "imageOptimizer", categories: [c.image] },
  { slug: "paint-on-image", labelKey: "paintOnImage", categories: [c.image] },
  { slug: "jpg-to-pdf", labelKey: "imageToPdf", categories: [c.image] },
  { slug: "png-to-pdf", labelKey: "pngToPdf", categories: [c.image] },
  { slug: "heic-to-pdf", labelKey: "heicToPdf", categories: [c.image] },

  // Video
  { slug: "video-to-mp4", labelKey: "videoToMp4", categories: [c.video] },
  { slug: "video-resizer", labelKey: "videoResizer", categories: [c.video, c.image] },
  { slug: "video-rotator", labelKey: "videoRotator", categories: [c.video, c.image] },
  { slug: "video-speed-controller", labelKey: "videoSpeedController", categories: [c.video] },
  { slug: "video-to-gif", labelKey: "videoToGif", categories: [c.video] },

  // Favicon
  { slug: "generate-favicon", labelKey: "generateFavicon", categories: [c.favicon] },
  { slug: "png-to-ico", labelKey: "pngToIco", categories: [c.favicon] },
  { slug: "ico-to-png", labelKey: "icoToPng", categories: [c.favicon] },
  { slug: "svg-to-favicon", labelKey: "svgToFavicon", categories: [c.favicon] },
  { slug: "favicon-pack", labelKey: "faviconPack", categories: [c.favicon] },
  { slug: "apple-touch-icon", labelKey: "appleTouchIcon", categories: [c.favicon] },
  { slug: "favicon-cropper", labelKey: "faviconCropper", categories: [c.favicon] },
  { slug: "transparent-favicon", labelKey: "transparentFavicon", categories: [c.favicon] },
  { slug: "favicon-code-generator", labelKey: "faviconCodeGenerator", categories: [c.favicon] },
  { slug: "favicon-previewer", labelKey: "faviconPreviewer", categories: [c.favicon] },

  // Developer
  { slug: "user-agent-parser", labelKey: "userAgentParser", categories: [c.developerBrowser] },
  { slug: "jwt-debugger", labelKey: "jwtDebugger", categories: [c.developerTokens] },
  { slug: "qr-code-generator", labelKey: "qrCodeGenerator", categories: [c.developerGenerators] },
  { slug: "json-formatter", labelKey: "jsonFormatter", categories: [c.developerJson] },
  { slug: "json-to-csv", labelKey: "jsonToCsv", categories: [c.developerJson] },
  { slug: "json-minifier", labelKey: "jsonMinifier", categories: [c.developerJson] },
  { slug: "csv-to-json", labelKey: "csvToJson", categories: [c.developerJson] },
  { slug: "html-markdown-converter", labelKey: "htmlMarkdownConverter", categories: [c.developerJson] },
  { slug: "markdown-to-pdf", labelKey: "markdownToPdf", categories: [c.developerPublish] },
  { slug: "html-to-pdf", labelKey: "htmlToPdf", categories: [c.developerPublish] },
  { slug: "invoice-generator", labelKey: "invoiceGenerator", categories: [c.developerWorkflows] },
  { slug: "timeline-gantt-generator", labelKey: "timelineGanttGenerator", categories: [c.developerWorkflows] },
  { slug: "data-converter-visualizer", labelKey: "dataConverter", categories: [c.developerWorkflows] },

  // Utilities
  { slug: "base64-encoder-decoder", labelKey: "base64EncoderDecoder", categories: [c.utilitiesEncoders] },
  { slug: "url-encoder-decoder", labelKey: "urlEncoderDecoder", categories: [c.utilitiesEncoders] },
  { slug: "string-generator", labelKey: "stringGenerator", categories: [c.utilitiesEncoders] },
  { slug: "text-diff-checker", labelKey: "textDiffChecker", categories: [c.utilitiesText] },

  // Data & conversion
  { slug: "yaml-json-converter", labelKey: "yamlJsonConverter", categories: [c.dataConversion] },
  { slug: "csv-to-markdown-table", labelKey: "csvToMarkdownTable", categories: [c.dataConversion] },
  { slug: "sql-query-formatter", labelKey: "sqlQueryFormatter", categories: [c.dataConversion] },

  // Security generators
  { slug: "password-generator", labelKey: "passwordGenerator", categories: [c.security] },
  { slug: "hash-generator", labelKey: "hashGenerator", categories: [c.security] },
  { slug: "uuid-generator", labelKey: "uuidGenerator", categories: [c.security] },

  // Productivity
  { slug: "unit-converter", labelKey: "unitConverter", categories: [c.productivity] },
  { slug: "timezone-converter", labelKey: "timezoneConverter", categories: [c.productivity] },
  { slug: "word-character-counter", labelKey: "wordCharacterCounter", categories: [c.productivity] },
  { slug: "reading-time-calculator", labelKey: "readingTimeCalculator", categories: [c.productivity] },
  { slug: "case-converter", labelKey: "caseConverter", categories: [c.productivity] },
];

export type HeaderNavTreeSection = {
  id: string;
  labelKey: `navSections.${string}`;
  categories: ToolCategory[];
};

export type HeaderNavTreeGroup =
  | {
      id: string;
      labelKey: `nav.${string}`;
      categories: ToolCategory[];
    }
  | {
      id: string;
      labelKey: `nav.${string}`;
      sections: HeaderNavTreeSection[];
    };

/** @deprecated Header uses MEGA_MENU_CONFIG — kept for reference only. */
export const HEADER_NAV_TREE: HeaderNavTreeGroup[] = [
  {
    id: "pdf",
    labelKey: "nav.pdf",
    sections: [
      { id: "pdf-edit", labelKey: "navSections.pdfEditSection", categories: [c.pdfEdit] },
      { id: "pdf-security", labelKey: "navSections.pdfSecuritySection", categories: [c.pdfSecurity] },
      { id: "pdf-convert-in", labelKey: "navSections.pdfConvertInSection", categories: [c.pdfConvertIn] },
      { id: "pdf-export", labelKey: "navSections.pdfExportSection", categories: [c.pdfExport] },
    ],
  },
  { id: "image", labelKey: "nav.image", categories: [c.image] },
  { id: "video", labelKey: "nav.video", categories: [c.video] },
  {
    id: "developer",
    labelKey: "nav.developer",
    sections: [
      { id: "developer-browser", labelKey: "navSections.developerBrowserSection", categories: [c.developerBrowser] },
      { id: "developer-tokens", labelKey: "navSections.developerTokensSection", categories: [c.developerTokens] },
      { id: "developer-generators", labelKey: "navSections.developerGeneratorsSection", categories: [c.developerGenerators] },
      { id: "developer-json", labelKey: "navSections.developerJsonSection", categories: [c.developerJson] },
      { id: "developer-favicon", labelKey: "navSections.developerFaviconSection", categories: [c.favicon] },
      { id: "developer-publish", labelKey: "navSections.developerPublishSection", categories: [c.developerPublish] },
      { id: "developer-workflows", labelKey: "navSections.developerWorkflowsSection", categories: [c.developerWorkflows] },
    ],
  },
  {
    id: "utilities",
    labelKey: "nav.utilities",
    sections: [
      { id: "utilities-encoders", labelKey: "navSections.utilitiesEncodersSection", categories: [c.utilitiesEncoders] },
      { id: "utilities-text", labelKey: "navSections.utilitiesTextSection", categories: [c.utilitiesText] },
    ],
  },
  { id: "dataConversion", labelKey: "nav.dataConversion", categories: [c.dataConversion] },
  { id: "security", labelKey: "nav.security", categories: [c.security] },
  { id: "productivity", labelKey: "nav.productivity", categories: [c.productivity] },
];

export type AllToolsColumnConfig = {
  id: string;
  /** Key under Header.megaMenu.columns */
  labelKey: string;
  slugs: string[];
};

export type AllToolsGroupConfig = {
  id: "convert" | "compress" | "resize" | "security" | "design";
  /** Key under Header.megaMenu or Header.headerNav */
  labelKey: string;
  columns: AllToolsColumnConfig[];
};

/** Header modal categories — buttons map 1:1 to registry group ids (except "all"). */
export const HEADER_CATEGORY_IDS = ["convert", "compress", "resize", "all"] as const;
export type HeaderCategoryId = (typeof HEADER_CATEGORY_IDS)[number];

export const HEADER_CATEGORY_BUTTONS: {
  id: HeaderCategoryId;
  labelKey: string;
}[] = [
  { id: "convert", labelKey: "megaMenu.convert" },
  { id: "compress", labelKey: "megaMenu.compress" },
  { id: "resize", labelKey: "headerNav.resize" },
  { id: "all", labelKey: "allTools.button" },
];

/**
 * Header navigation registry — Convert, Compress, and Resize tools only.
 * Each slug must exist in TOOL_DEFINITIONS. Tools outside these categories are excluded.
 */
export const TOOL_REGISTRY = {
  Convert: [
    // PDF — convert to PDF
    "word-to-pdf",
    "excel-to-pdf",
    "powerpoint-to-pdf",
    "openoffice-to-pdf",
    "ebook-to-pdf",
    "iwork-to-pdf",
    "autocad-to-pdf",
    "markdown-to-pdf",
    "html-to-pdf",
    "jpg-to-pdf",
    "png-to-pdf",
    "heic-to-pdf",
    // PDF — export from PDF
    "pdf-to-jpg",
    "pdf-to-png",
    "pdf-to-text",
    "pdf-to-html",
    "pdf-to-epub",
    "pdf-to-xps",
    "extract-images",
    "pdf-to-word",
    "pdf-to-excel",
    "extract-tables-pdf",
    "pdf-to-powerpoint",
    "pdf-a-converter",
    "pdf-linearization",
    "n-up-pdf",
    "grayscale-pdf",
    // Image & video formats
    "heic-to-jpg",
    "webp-to-jpg",
    "svg-to-png",
    "image-grayscale",
    "flip-image",
    "image-metadata-editor",
    "image-optimizer",
    "paint-on-image",
    "convert-to-png",
    "video-to-mp4",
    "video-to-gif",
    "png-to-ico",
    "ico-to-png",
    "svg-to-favicon",
    // Data & text format conversion
    "yaml-json-converter",
    "csv-to-json",
    "json-to-csv",
    "html-markdown-converter",
    "csv-to-markdown-table",
    "base64-encoder-decoder",
    "url-encoder-decoder",
  ],
  Compress: ["pdf-compress", "compress-image", "image-optimizer", "video-compressor", "favicon-compressor"],
  Resize: [
    "resize-image",
    "crop-image",
    "rotate-image",
    "flip-image",
    "paint-on-image",
    "video-resizer",
    "video-rotator",
    "crop-pdf",
    "rotate-pdf",
    "custom-paper-margin",
    "favicon-cropper",
  ],
} as const;

export type ToolRegistryCategory = keyof typeof TOOL_REGISTRY;

const REGISTRY_SLUG_SET = new Set<string>([
  ...TOOL_REGISTRY.Convert,
  ...TOOL_REGISTRY.Compress,
  ...TOOL_REGISTRY.Resize,
]);

/** Returns Convert | Compress | Resize for registry tools, or null if excluded. */
export function getToolRegistryCategory(slug: string): ToolRegistryCategory | null {
  if (TOOL_REGISTRY.Convert.includes(slug as (typeof TOOL_REGISTRY.Convert)[number])) return "Convert";
  if (TOOL_REGISTRY.Compress.includes(slug as (typeof TOOL_REGISTRY.Compress)[number])) return "Compress";
  if (TOOL_REGISTRY.Resize.includes(slug as (typeof TOOL_REGISTRY.Resize)[number])) return "Resize";
  return null;
}

export function isRegistryTool(slug: string): boolean {
  return REGISTRY_SLUG_SET.has(slug);
}

function columnSlugs(slugs: readonly string[], allowed: readonly string[]): string[] {
  const allowedSet = new Set(allowed);
  return slugs.filter((slug) => allowedSet.has(slug));
}

const CONVERT_SLUGS = TOOL_REGISTRY.Convert;

/**
 * All-tools modal layout — header categories mirror TOOL_REGISTRY; other tools appear under design/security.
 */
export const ALL_TOOLS_REGISTRY: AllToolsGroupConfig[] = [
  {
    id: "convert",
    labelKey: "megaMenu.convert",
    columns: [
      {
        id: "pdf-to",
        labelKey: "megaMenu.columns.pdfTo",
        slugs: columnSlugs(
          [
            "word-to-pdf",
            "excel-to-pdf",
            "powerpoint-to-pdf",
            "openoffice-to-pdf",
            "ebook-to-pdf",
            "iwork-to-pdf",
            "autocad-to-pdf",
            "markdown-to-pdf",
            "html-to-pdf",
            "jpg-to-pdf",
            "png-to-pdf",
            "heic-to-pdf",
          ],
          CONVERT_SLUGS,
        ),
      },
      {
        id: "pdf-from",
        labelKey: "megaMenu.columns.pdfFrom",
        slugs: columnSlugs(
          [
            "pdf-to-jpg",
            "pdf-to-png",
            "pdf-to-text",
            "pdf-to-html",
            "pdf-to-epub",
            "pdf-to-xps",
            "extract-images",
            "pdf-to-word",
            "pdf-to-excel",
            "extract-tables-pdf",
            "pdf-to-powerpoint",
            "pdf-a-converter",
            "pdf-linearization",
            "n-up-pdf",
            "grayscale-pdf",
          ],
          CONVERT_SLUGS,
        ),
      },
      {
        id: "video",
        labelKey: "megaMenu.columns.video",
        slugs: columnSlugs(
          ["video-to-mp4", "video-to-gif", "video-speed-controller"],
          CONVERT_SLUGS,
        ),
      },
      {
        id: "image-formats",
        labelKey: "megaMenu.columns.imageFormats",
        slugs: columnSlugs(
          ["heic-to-jpg", "webp-to-jpg", "svg-to-png", "image-grayscale", "flip-image", "image-metadata-editor", "image-optimizer", "paint-on-image", "convert-to-png", "png-to-ico", "ico-to-png", "svg-to-favicon"],
          CONVERT_SLUGS,
        ),
      },
      {
        id: "data-formats",
        labelKey: "nav.dataConversion",
        slugs: columnSlugs(
          [
            "yaml-json-converter",
            "csv-to-json",
            "json-to-csv",
            "html-markdown-converter",
            "csv-to-markdown-table",
          ],
          CONVERT_SLUGS,
        ),
      },
      {
        id: "encoders",
        labelKey: "navSections.utilitiesEncodersSection",
        slugs: columnSlugs(["base64-encoder-decoder", "url-encoder-decoder"], CONVERT_SLUGS),
      },
    ],
  },
  {
    id: "compress",
    labelKey: "megaMenu.compress",
    columns: [
      {
        id: "pdf",
        labelKey: "megaMenu.columns.pdf",
        slugs: ["pdf-compress"],
      },
      {
        id: "images",
        labelKey: "megaMenu.columns.images",
        slugs: ["compress-image", "image-optimizer"],
      },
      {
        id: "video",
        labelKey: "megaMenu.columns.video",
        slugs: ["video-compressor", "video-resizer", "video-rotator"],
      },
      {
        id: "favicon",
        labelKey: "megaMenu.columns.favicon",
        slugs: ["favicon-compressor"],
      },
    ],
  },
  {
    id: "resize",
    labelKey: "headerNav.resize",
    columns: [
      {
        id: "image",
        labelKey: "megaMenu.columns.image",
        slugs: columnSlugs(["resize-image", "crop-image", "rotate-image", "flip-image", "paint-on-image"], TOOL_REGISTRY.Resize),
      },
      {
        id: "pdf",
        labelKey: "megaMenu.columns.pdf",
        slugs: columnSlugs(["crop-pdf", "rotate-pdf", "custom-paper-margin"], TOOL_REGISTRY.Resize),
      },
      {
        id: "favicon",
        labelKey: "megaMenu.columns.favicon",
        slugs: columnSlugs(["favicon-cropper"], TOOL_REGISTRY.Resize),
      },
    ],
  },
  {
    id: "security",
    labelKey: "megaMenu.security",
    columns: [
      {
        id: "pdf-security",
        labelKey: "megaMenu.columns.pdfSecurity",
        slugs: [
          "protect-pdf",
          "unlock-pdf",
          "pdf-password-recovery",
          "redact-pdf",
          "safe-to-share-auditor",
          "remove-hidden-metadata",
          "sign-pdf",
          "pdf-signature-validator",
        ],
      },
      {
        id: "security-generators",
        labelKey: "megaMenu.columns.securityGenerators",
        slugs: ["password-generator", "hash-generator", "uuid-generator"],
      },
    ],
  },
  {
    id: "design",
    labelKey: "megaMenu.design",
    columns: [
      {
        id: "pdf-organize",
        labelKey: "megaMenu.columns.pdfOrganize",
        slugs: [
          "pdf-merge",
          "pdf-split",
          "batch-rename-pdf",
          "compare-pdf",
          "pdf-to-booklet",
          "reorder-pdf-pages",
          "extract-pdf-pages",
          "delete-pdf-pages",
        ],
      },
      {
        id: "pdf-edit",
        labelKey: "megaMenu.columns.pdfEdit",
        slugs: [
          "add-page-numbers",
          "add-watermark",
          "annotate-pdf",
          "pdf-text-editor",
          "flatten-pdf",
          "repair-pdf",
          "pdf-metadata-editor",
        ],
      },
      {
        id: "favicon",
        labelKey: "megaMenu.columns.faviconTools",
        slugs: [
          "generate-favicon",
          "favicon-pack",
          "apple-touch-icon",
          "transparent-favicon",
          "favicon-code-generator",
          "favicon-previewer",
        ],
      },
      {
        id: "developer",
        labelKey: "megaMenu.columns.developer",
        slugs: [
          "user-agent-parser",
          "jwt-debugger",
          "qr-code-generator",
          "json-formatter",
          "json-minifier",
          "invoice-generator",
          "timeline-gantt-generator",
          "data-converter-visualizer",
        ],
      },
      {
        id: "utilities",
        labelKey: "megaMenu.columns.utilities",
        slugs: [
          "string-generator",
          "text-diff-checker",
          "sql-query-formatter",
          "unit-converter",
          "timezone-converter",
          "word-character-counter",
          "reading-time-calculator",
          "case-converter",
        ],
      },
    ],
  },
];

/** @deprecated Use ALL_TOOLS_REGISTRY */
export const MEGA_MENU_CONFIG = ALL_TOOLS_REGISTRY;

export type FooterPanelGroup = {
  id: string;
  labelKey: string;
  categories: ToolCategory[];
};

/** Footer tools panel columns — semantic groupings from the same registry. */
export const FOOTER_PANEL_GROUPS: FooterPanelGroup[] = [
  { id: "compress", labelKey: "registry.compress", categories: [c.compress] },
  { id: "security", labelKey: "megaMenu.security", categories: [c.pdfSecurity, c.security] },
  { id: "pdf", labelKey: "nav.pdf", categories: [c.pdfEdit, c.pdfConvertIn, c.pdfExport] },
  { id: "image", labelKey: "nav.image", categories: [c.image] },
  { id: "video", labelKey: "nav.video", categories: [c.video] },
  { id: "favicon", labelKey: "registry.favicon", categories: [c.favicon] },
  {
    id: "developer",
    labelKey: "nav.developer",
    categories: [
      c.developerBrowser,
      c.developerTokens,
      c.developerGenerators,
      c.developerJson,
      c.developerPublish,
      c.developerWorkflows,
    ],
  },
  { id: "utilities", labelKey: "nav.utilities", categories: [c.utilitiesEncoders, c.utilitiesText] },
  { id: "dataConversion", labelKey: "nav.dataConversion", categories: [c.dataConversion] },
  { id: "productivity", labelKey: "nav.productivity", categories: [c.productivity] },
];

/** Search index entry — built at runtime via `buildSearchIndex` in `@/lib/search-index`. */
export type SearchAssetType = "Tool" | "Article";

export type SearchIndexEntry = {
  type: SearchAssetType;
  title: string;
  path: string;
  /** Display label only — not included in search scoring. */
  category: string;
  /** Meta description / summary (weight ×1 in search). */
  description?: string;
  /** Primary SEO keywords and slug hints (weight ×1 in search). */
  metaKeywords?: string;
};
