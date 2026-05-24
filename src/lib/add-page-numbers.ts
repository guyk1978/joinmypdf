import { PDFDocument, StandardFonts, rgb } from "pdf-lib-with-encrypt";

export type PageNumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type PageNumberFormat = "number" | "page-of";

export type PageNumberFontSize = "small" | "medium" | "large";

export type PageNumberFontColor = "#000000" | "#6B7280" | "#2563EB" | "#DC2626";

export const PAGE_NUMBER_FONT_SIZE_PX: Record<PageNumberFontSize, number> = {
  small: 9,
  medium: 12,
  large: 16,
};

export const PAGE_NUMBER_COLOR_OPTIONS: { value: PageNumberFontColor; label: string }[] = [
  { value: "#000000", label: "Black" },
  { value: "#6B7280", label: "Gray" },
  { value: "#2563EB", label: "Blue" },
  { value: "#DC2626", label: "Red" },
];

export type AddPageNumbersOptions = {
  position: PageNumberPosition;
  startPage: number;
  format: PageNumberFormat;
  fontSize: PageNumberFontSize;
  fontColorHex: PageNumberFontColor;
  isBold: boolean;
};

const MARGIN = 28;

function formatLabel(displayNum: number, totalNumbered: number, format: PageNumberFormat) {
  if (format === "page-of") {
    return `Page ${displayNum} of ${totalNumbered}`;
  }
  return String(displayNum);
}

export function pageNumberFontSizePx(size: PageNumberFontSize): number {
  return PAGE_NUMBER_FONT_SIZE_PX[size] ?? PAGE_NUMBER_FONT_SIZE_PX.medium;
}

export function hexToPdfRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) {
    return rgb(0, 0, 0);
  }
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function textPosition(
  pageWidth: number,
  pageHeight: number,
  position: PageNumberPosition,
  textWidth: number,
  fontSize: number,
): { x: number; y: number } {
  const pad = MARGIN;
  switch (position) {
    case "top-left":
      return { x: pad, y: pageHeight - pad - fontSize };
    case "top-center":
      return { x: (pageWidth - textWidth) / 2, y: pageHeight - pad - fontSize };
    case "top-right":
      return { x: pageWidth - pad - textWidth, y: pageHeight - pad - fontSize };
    case "bottom-left":
      return { x: pad, y: pad };
    case "bottom-center":
      return { x: (pageWidth - textWidth) / 2, y: pad };
    case "bottom-right":
    default:
      return { x: pageWidth - pad - textWidth, y: pad };
  }
}

export async function addPageNumbersBytes(
  file: File,
  options: AddPageNumbersOptions,
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(
    options.isBold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
  );
  const totalPages = doc.getPageCount();
  if (!totalPages) throw new Error("This PDF has no pages.");

  const fontSize = pageNumberFontSizePx(options.fontSize);
  const color = hexToPdfRgb(options.fontColorHex);
  const startPage = Math.max(1, Math.min(Math.floor(options.startPage) || 1, totalPages));
  const numberedCount = totalPages - startPage + 1;
  let displayNum = 1;

  for (let i = startPage - 1; i < totalPages; i += 1) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const label = formatLabel(displayNum, numberedCount, options.format);
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const { x, y } = textPosition(width, height, options.position, textWidth, fontSize);

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color,
    });
    displayNum += 1;
  }

  return doc.save({ useObjectStreams: false });
}

export function addPageNumbersOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-numbered.pdf`;
}
