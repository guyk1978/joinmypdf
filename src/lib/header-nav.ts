import type { NavDropdown, NavDropdownSection } from "@/lib/nav-config";

export type HeaderNavDropdownId = "image" | "pdf" | "utilities";

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
      id: "image" | "pdf";
      items: HeaderNavItemSpec[];
    }
  | {
      id: "utilities";
      sections: HeaderNavSectionSpec[];
    };

/** Image-only tools and image conversion workflows. */
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

/** Text and JSON utility tools. */
export const TEXT_JSON_NAV_ITEMS: HeaderNavItemSpec[] = [
  { href: "/tools/json-formatter/", labelKey: "jsonFormatter" },
  { href: "/tools/json-to-csv/", labelKey: "jsonToCsv" },
  { href: "/tools/json-minifier/", labelKey: "jsonMinifier" },
  { href: "/tools/csv-to-json/", labelKey: "csvToJson" },
  { href: "/tools/base64-encoder-decoder/", labelKey: "base64EncoderDecoder" },
  { href: "/tools/url-encoder-decoder/", labelKey: "urlEncoderDecoder" },
  { href: "/tools/text-diff-checker/", labelKey: "textDiffChecker" },
  { href: "/tools/string-generator/", labelKey: "stringGenerator" },
  { href: "/tools/html-markdown-converter/", labelKey: "htmlMarkdownConverter" },
  { href: "/tools/word-character-counter/", labelKey: "wordCharacterCounter" },
];

/** PDF edit, security, and document conversion tools. */
const PDF_NAV_ITEMS: HeaderNavItemSpec[] = [
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
  { href: "/tools/sign-pdf/", labelKey: "signPdf" },
  { href: "/tools/annotate-pdf/", labelKey: "annotatePdf" },
  { href: "/tools/compare-pdf/", labelKey: "comparePdf" },
  { href: "/tools/pdf-to-booklet/", labelKey: "pdfToBooklet" },
  { href: "/tools/batch-rename-pdf/", labelKey: "batchRenamePdf" },
  { href: "/tools/pdf-text-editor/", labelKey: "pdfTextEditor" },
  { href: "/tools/custom-paper-margin/", labelKey: "customPaperMargin" },
  { href: "/tools/flatten-pdf/", labelKey: "flattenPdf" },
  { href: "/tools/repair-pdf/", labelKey: "repairPdf" },
  { href: "/tools/protect-pdf/", labelKey: "protectPdf" },
  { href: "/tools/unlock-pdf/", labelKey: "unlockPdf" },
  { href: "/tools/pdf-password-recovery/", labelKey: "pdfPasswordRecovery" },
  { href: "/tools/redact-pdf/", labelKey: "redactPdf" },
  { href: "/tools/safe-to-share-auditor/", labelKey: "safeToShareAuditor" },
  { href: "/tools/remove-hidden-metadata/", labelKey: "removeHiddenMetadata" },
  { href: "/tools/pdf-to-jpg/", labelKey: "pdfToJpg" },
  { href: "/tools/pdf-to-png/", labelKey: "pdfToPng" },
  { href: "/tools/pdf-to-text/", labelKey: "pdfToText" },
  { href: "/tools/extract-images/", labelKey: "extractImages" },
  { href: "/tools/pdf-to-word/", labelKey: "pdfToWord" },
  { href: "/tools/word-to-pdf/", labelKey: "wordToPdf" },
  { href: "/tools/excel-to-pdf/", labelKey: "excelToPdf" },
  { href: "/tools/pdf-to-excel/", labelKey: "pdfToExcel" },
  { href: "/tools/powerpoint-to-pdf/", labelKey: "powerpointToPdf" },
  { href: "/tools/pdf-to-powerpoint/", labelKey: "pdfToPowerpoint" },
  { href: "/tools/markdown-to-pdf/", labelKey: "markdownToPdf" },
  { href: "/tools/html-to-pdf/", labelKey: "htmlToPdf" },
  { href: "/tools/ebook-to-pdf/", labelKey: "ebookToPdf" },
  { href: "/tools/iwork-to-pdf/", labelKey: "iworkToPdf" },
  { href: "/tools/openoffice-to-pdf/", labelKey: "openofficeToPdf" },
  { href: "/tools/autocad-to-pdf/", labelKey: "autocadToPdf" },
];

export const HEADER_NAV_SPECS: HeaderNavDropdownSpec[] = [
  { id: "image", items: IMAGE_NAV_ITEMS },
  { id: "pdf", items: PDF_NAV_ITEMS },
  {
    id: "utilities",
    sections: [
      { id: "favicon", labelKey: "utilitiesFaviconSection", items: FAVICON_NAV_ITEMS },
      { id: "textJson", labelKey: "utilitiesTextJsonSection", items: TEXT_JSON_NAV_ITEMS },
    ],
  },
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

export function buildHeaderNavDropdowns(t: HeaderNavTranslator): NavDropdown[] {
  return HEADER_NAV_SPECS.map((spec) => {
    if (spec.id === "utilities") {
      const sections: NavDropdownSection[] = spec.sections.map((section) => ({
        id: section.id,
        label: t(`navSections.${section.labelKey}`),
        items: mapNavItems(t, section.items),
      }));

      return {
        id: spec.id,
        label: t(`nav.${spec.id}`),
        sections,
      };
    }

    return {
      id: spec.id,
      label: t(`nav.${spec.id}`),
      items: mapNavItems(t, spec.items),
    };
  });
}
