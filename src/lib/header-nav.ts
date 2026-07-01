import type { NavDropdown, NavDropdownSection } from "@/lib/nav-config";

export type HeaderNavDropdownId =
  | "pdf"
  | "image"
  | "developer"
  | "utilities"
  | "dataConversion"
  | "security"
  | "productivity";

type HeaderNavItemSpec = {
  href: string;
  labelKey: string;
};

type HeaderNavSectionSpec = {
  id: string;
  labelKey: string;
  items: HeaderNavItemSpec[];
};

type HeaderNavDropdownSpec =
  | {
      id: "image" | "dataConversion" | "security" | "productivity";
      items: HeaderNavItemSpec[];
    }
  | {
      id: "pdf" | "developer" | "utilities";
      sections: HeaderNavSectionSpec[];
    };

/** Image editing and image-to-PDF workflows. */
const IMAGE_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/resize-image/", labelKey: "resizeImage" },
  { href: "/tools/convert-to-png/", labelKey: "convertToPng" },
  { href: "/tools/crop-image/", labelKey: "cropImage" },
  { href: "/tools/rotate-image/", labelKey: "rotateImage" },
  { href: "/tools/compress-image/", labelKey: "compressImage" },
  { href: "/tools/heic-to-jpg/", labelKey: "heicToJpg" },
  { href: "/tools/jpg-to-pdf/", labelKey: "imageToPdf" },
  { href: "/tools/png-to-pdf/", labelKey: "pngToPdf" },
  { href: "/tools/heic-to-pdf/", labelKey: "heicToPdf" },
];

const PDF_EDIT_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/pdf-merge/", labelKey: "mergePdf" },
  { href: "/tools/pdf-split/", labelKey: "splitPdf" },
  { href: "/tools/pdf-compress/", labelKey: "compressPdf" },
  { href: "/tools/rotate-pdf/", labelKey: "rotatePdf" },
  { href: "/tools/crop-pdf/", labelKey: "cropPdf" },
  { href: "/tools/delete-pdf-pages/", labelKey: "deletePdfPages" },
  { href: "/tools/reorder-pdf-pages/", labelKey: "reorderPdfPages" },
  { href: "/tools/extract-pdf-pages/", labelKey: "extractPdfPages" },
  { href: "/tools/add-page-numbers/", labelKey: "addPageNumbers" },
  { href: "/tools/add-watermark/", labelKey: "addWatermark" },
  { href: "/tools/annotate-pdf/", labelKey: "annotatePdf" },
  { href: "/tools/compare-pdf/", labelKey: "comparePdf" },
  { href: "/tools/pdf-to-booklet/", labelKey: "pdfToBooklet" },
  { href: "/tools/batch-rename-pdf/", labelKey: "batchRenamePdf" },
  { href: "/tools/pdf-text-editor/", labelKey: "pdfTextEditor" },
  { href: "/tools/custom-paper-margin/", labelKey: "customPaperMargin" },
  { href: "/tools/flatten-pdf/", labelKey: "flattenPdf" },
  { href: "/tools/repair-pdf/", labelKey: "repairPdf" },
];

const PDF_SECURITY_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/protect-pdf/", labelKey: "protectPdf" },
  { href: "/tools/unlock-pdf/", labelKey: "unlockPdf" },
  { href: "/tools/pdf-password-recovery/", labelKey: "pdfPasswordRecovery" },
  { href: "/tools/redact-pdf/", labelKey: "redactPdf" },
  { href: "/tools/safe-to-share-auditor/", labelKey: "safeToShareAuditor" },
  { href: "/tools/remove-hidden-metadata/", labelKey: "removeHiddenMetadata" },
  { href: "/tools/sign-pdf/", labelKey: "signPdf" },
];

const PDF_CONVERT_IN_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/word-to-pdf/", labelKey: "wordToPdf" },
  { href: "/tools/excel-to-pdf/", labelKey: "excelToPdf" },
  { href: "/tools/powerpoint-to-pdf/", labelKey: "powerpointToPdf" },
  { href: "/tools/openoffice-to-pdf/", labelKey: "openofficeToPdf" },
  { href: "/tools/ebook-to-pdf/", labelKey: "ebookToPdf" },
  { href: "/tools/iwork-to-pdf/", labelKey: "iworkToPdf" },
  { href: "/tools/autocad-to-pdf/", labelKey: "autocadToPdf" },
];

const PDF_EXPORT_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/pdf-to-jpg/", labelKey: "pdfToJpg" },
  { href: "/tools/pdf-to-png/", labelKey: "pdfToPng" },
  { href: "/tools/pdf-to-text/", labelKey: "pdfToText" },
  { href: "/tools/extract-images/", labelKey: "extractImages" },
  { href: "/tools/pdf-to-word/", labelKey: "pdfToWord" },
  { href: "/tools/pdf-to-excel/", labelKey: "pdfToExcel" },
  { href: "/tools/pdf-to-powerpoint/", labelKey: "pdfToPowerpoint" },
];

/** Favicon generation and icon format conversion tools. */
export const FAVICON_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/generate-favicon/", labelKey: "generateFavicon" },
  { href: "/tools/png-to-ico/", labelKey: "pngToIco" },
  { href: "/tools/ico-to-png/", labelKey: "icoToPng" },
  { href: "/tools/svg-to-favicon/", labelKey: "svgToFavicon" },
  { href: "/tools/favicon-pack/", labelKey: "faviconPack" },
  { href: "/tools/apple-touch-icon/", labelKey: "appleTouchIcon" },
  { href: "/tools/favicon-compressor/", labelKey: "faviconCompressor" },
  { href: "/tools/favicon-cropper/", labelKey: "faviconCropper" },
  { href: "/tools/transparent-favicon/", labelKey: "transparentFavicon" },
  { href: "/tools/favicon-code-generator/", labelKey: "faviconCodeGenerator" },
  { href: "/tools/favicon-previewer/", labelKey: "faviconPreviewer" },
];

const DEVELOPER_TOKEN_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/jwt-debugger/", labelKey: "jwtDebugger" },
];

const DEVELOPER_GENERATOR_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/qr-code-generator/", labelKey: "qrCodeGenerator" },
];

const DEVELOPER_BROWSER_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/user-agent-parser/", labelKey: "userAgentParser" },
];

const DEVELOPER_JSON_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/json-formatter/", labelKey: "jsonFormatter" },
  { href: "/tools/json-to-csv/", labelKey: "jsonToCsv" },
  { href: "/tools/json-minifier/", labelKey: "jsonMinifier" },
  { href: "/tools/csv-to-json/", labelKey: "csvToJson" },
  { href: "/tools/html-markdown-converter/", labelKey: "htmlMarkdownConverter" },
];

const DEVELOPER_PUBLISH_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/markdown-to-pdf/", labelKey: "markdownToPdf" },
  { href: "/tools/html-to-pdf/", labelKey: "htmlToPdf" },
];

const DEVELOPER_WORKFLOW_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/invoice-generator/", labelKey: "invoiceGenerator" },
  { href: "/tools/timeline-gantt-generator/", labelKey: "timelineGanttGenerator" },
  { href: "/tools/data-converter-visualizer/", labelKey: "dataConverter" },
];

/** All text & JSON tools (directory pages). */
export const TEXT_JSON_NAV_ITEMS: HeaderNavItemSpec[] = [
  ...DEVELOPER_JSON_NAV_ITEMS,
  { href: "/tools/base64-encoder-decoder/", labelKey: "base64EncoderDecoder" },
  { href: "/tools/url-encoder-decoder/", labelKey: "urlEncoderDecoder" },
  { href: "/tools/text-diff-checker/", labelKey: "textDiffChecker" },
  { href: "/tools/string-generator/", labelKey: "stringGenerator" },
  { href: "/tools/word-character-counter/", labelKey: "wordCharacterCounter" },
];

const UTILITIES_ENCODER_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/base64-encoder-decoder/", labelKey: "base64EncoderDecoder" },
  { href: "/tools/url-encoder-decoder/", labelKey: "urlEncoderDecoder" },
  { href: "/tools/string-generator/", labelKey: "stringGenerator" },
];

const UTILITIES_TEXT_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/text-diff-checker/", labelKey: "textDiffChecker" },
];

const DATA_CONVERSION_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/yaml-json-converter/", labelKey: "yamlJsonConverter" },
  { href: "/tools/csv-to-markdown-table/", labelKey: "csvToMarkdownTable" },
  { href: "/tools/sql-query-formatter/", labelKey: "sqlQueryFormatter" },
];

const SECURITY_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/password-generator/", labelKey: "passwordGenerator" },
  { href: "/tools/hash-generator/", labelKey: "hashGenerator" },
  { href: "/tools/uuid-generator/", labelKey: "uuidGenerator" },
];

const PRODUCTIVITY_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/unit-converter/", labelKey: "unitConverter" },
  { href: "/tools/timezone-converter/", labelKey: "timezoneConverter" },
  { href: "/tools/word-character-counter/", labelKey: "wordCharacterCounter" },
  { href: "/tools/reading-time-calculator/", labelKey: "readingTimeCalculator" },
];

export const HEADER_NAV_SPECS: HeaderNavDropdownSpec[] = [
  {
    id: "pdf",
    sections: [
      { id: "pdf-edit", labelKey: "pdfEditSection", items: PDF_EDIT_NAV_ITEMS },
      { id: "pdf-security", labelKey: "pdfSecuritySection", items: PDF_SECURITY_NAV_ITEMS },
      { id: "pdf-convert-in", labelKey: "pdfConvertInSection", items: PDF_CONVERT_IN_NAV_ITEMS },
      { id: "pdf-export", labelKey: "pdfExportSection", items: PDF_EXPORT_NAV_ITEMS },
    ],
  },
  { id: "image", items: IMAGE_NAV_ITEMS },
  {
    id: "developer",
    sections: [
      { id: "developer-browser", labelKey: "developerBrowserSection", items: DEVELOPER_BROWSER_NAV_ITEMS },
      { id: "developer-tokens", labelKey: "developerTokensSection", items: DEVELOPER_TOKEN_NAV_ITEMS },
      { id: "developer-generators", labelKey: "developerGeneratorsSection", items: DEVELOPER_GENERATOR_NAV_ITEMS },
      { id: "developer-json", labelKey: "developerJsonSection", items: DEVELOPER_JSON_NAV_ITEMS },
      { id: "developer-favicon", labelKey: "developerFaviconSection", items: FAVICON_NAV_ITEMS },
      { id: "developer-publish", labelKey: "developerPublishSection", items: DEVELOPER_PUBLISH_NAV_ITEMS },
      { id: "developer-workflows", labelKey: "developerWorkflowsSection", items: DEVELOPER_WORKFLOW_NAV_ITEMS },
    ],
  },
  {
    id: "utilities",
    sections: [
      { id: "utilities-encoders", labelKey: "utilitiesEncodersSection", items: UTILITIES_ENCODER_NAV_ITEMS },
      { id: "utilities-text", labelKey: "utilitiesTextSection", items: UTILITIES_TEXT_NAV_ITEMS },
    ],
  },
  { id: "dataConversion", items: DATA_CONVERSION_NAV_ITEMS },
  { id: "security", items: SECURITY_NAV_ITEMS },
  { id: "productivity", items: PRODUCTIVITY_NAV_ITEMS },
];

type HeaderNavTranslator = {
  (key: string): string;
};

function mapNavItems(
  t: HeaderNavTranslator,
  items: HeaderNavItemSpec[],
): NavDropdownSection["items"] {
  return items.map((item) => ({
    href: item.href,
    label: t(`navItems.${item.labelKey}`),
  }));
}

function mapNavSections(
  t: HeaderNavTranslator,
  sections: HeaderNavSectionSpec[],
): NavDropdownSection[] {
  return sections.map((section) => ({
    id: section.id,
    label: t(`navSections.${section.labelKey}`),
    items: mapNavItems(t, section.items),
  }));
}

export function buildHeaderNavDropdowns(t: HeaderNavTranslator): NavDropdown[] {
  return HEADER_NAV_SPECS.map((spec) => {
    if ("items" in spec) {
      return {
        id: spec.id,
        label: t(`nav.${spec.id}`),
        items: mapNavItems(t, spec.items),
      };
    }

    return {
      id: spec.id,
      label: t(`nav.${spec.id}`),
      sections: mapNavSections(t, spec.sections),
    };
  });
}
