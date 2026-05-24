import { PDFDocument, StandardFonts, rgb } from "pdf-lib-with-encrypt";

export type PageNumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type PageNumberFormat = "number" | "page-of";

export type AddPageNumbersOptions = {
  position: PageNumberPosition;
  startPage: number;
  format: PageNumberFormat;
};

const MARGIN = 28;
const FONT_SIZE = 11;

function formatLabel(displayNum: number, totalNumbered: number, format: PageNumberFormat) {
  if (format === "page-of") {
    return `Page ${displayNum} of ${totalNumbered}`;
  }
  return String(displayNum);
}

function textPosition(
  pageWidth: number,
  pageHeight: number,
  position: PageNumberPosition,
  textWidth: number,
): { x: number; y: number } {
  const pad = MARGIN;
  switch (position) {
    case "top-left":
      return { x: pad, y: pageHeight - pad - FONT_SIZE };
    case "top-center":
      return { x: (pageWidth - textWidth) / 2, y: pageHeight - pad - FONT_SIZE };
    case "top-right":
      return { x: pageWidth - pad - textWidth, y: pageHeight - pad - FONT_SIZE };
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
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const totalPages = doc.getPageCount();
  if (!totalPages) throw new Error("This PDF has no pages.");

  const startPage = Math.max(1, Math.min(Math.floor(options.startPage) || 1, totalPages));
  const numberedCount = totalPages - startPage + 1;
  let displayNum = 1;

  for (let i = startPage - 1; i < totalPages; i += 1) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const label = formatLabel(displayNum, numberedCount, options.format);
    const textWidth = font.widthOfTextAtSize(label, FONT_SIZE);
    const { x, y } = textPosition(width, height, options.position, textWidth);

    page.drawText(label, {
      x,
      y,
      size: FONT_SIZE,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    displayNum += 1;
  }

  return doc.save({ useObjectStreams: false });
}

export function addPageNumbersOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-numbered.pdf`;
}
