import { PDFDocument, StandardFonts, degrees } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "./pdf-errors";
import { hexToPdfRgb } from "./add-page-numbers";

export type WatermarkPosition =
  | "center"
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type WatermarkOptions = {
  text: string;
  fontSize: number;
  colorHex: string;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
};

export const WATERMARK_POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
  { value: "middle-left", label: "Middle left" },
  { value: "middle-right", label: "Middle right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
];

const MARGIN = 48;

export function watermarkAnchor(
  pageWidth: number,
  pageHeight: number,
  position: WatermarkPosition,
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
    case "middle-left":
      return { x: pad, y: pageHeight / 2 - fontSize / 2 };
    case "middle-right":
      return { x: pageWidth - pad - textWidth, y: pageHeight / 2 - fontSize / 2 };
    case "bottom-left":
      return { x: pad, y: pad };
    case "bottom-center":
      return { x: (pageWidth - textWidth) / 2, y: pad };
    case "bottom-right":
      return { x: pageWidth - pad - textWidth, y: pad };
    case "center":
    default:
      return { x: (pageWidth - textWidth) / 2, y: pageHeight / 2 - fontSize / 2 };
  }
}

/** Canvas preview anchor (top-left origin, y down). */
export function watermarkPreviewAnchor(
  width: number,
  height: number,
  position: WatermarkPosition,
  textWidth: number,
  fontSize: number,
): { x: number; y: number } {
  const pad = MARGIN;
  switch (position) {
    case "top-left":
      return { x: pad + textWidth / 2, y: pad + fontSize / 2 };
    case "top-center":
      return { x: width / 2, y: pad + fontSize / 2 };
    case "top-right":
      return { x: width - pad - textWidth / 2, y: pad + fontSize / 2 };
    case "middle-left":
      return { x: pad + textWidth / 2, y: height / 2 };
    case "middle-right":
      return { x: width - pad - textWidth / 2, y: height / 2 };
    case "bottom-left":
      return { x: pad + textWidth / 2, y: height - pad - fontSize / 2 };
    case "bottom-center":
      return { x: width / 2, y: height - pad - fontSize / 2 };
    case "bottom-right":
      return { x: width - pad - textWidth / 2, y: height - pad - fontSize / 2 };
    case "center":
    default:
      return { x: width / 2, y: height / 2 };
  }
}

export function estimateTextWidth(text: string, fontSize: number): number {
  return Math.max(fontSize * 0.55 * text.length, fontSize * 2);
}

export async function addWatermarkBytes(
  file: File,
  options: WatermarkOptions,
): Promise<Uint8Array> {
  const text = options.text.trim();
  if (!text) throw new Error("Enter watermark text.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length) throw new Error("That file is empty.");

  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();
    if (!pageCount) throw new Error("This PDF has no pages.");

    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = Math.max(8, Math.min(120, options.fontSize));
    const color = hexToPdfRgb(options.colorHex);
    const opacity = Math.max(0, Math.min(1, options.opacity));
    const rotation = options.rotation;

    for (let i = 0; i < pageCount; i += 1) {
      const page = doc.getPage(i);
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const { x, y } = watermarkAnchor(width, height, options.position, textWidth, fontSize);

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(rotation),
      });
    }

    return doc.save({ useObjectStreams: false });
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function addWatermarkOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-watermarked.pdf`;
}

export const DEFAULT_WATERMARK_OPTIONS: WatermarkOptions = {
  text: "CONFIDENTIAL",
  fontSize: 42,
  colorHex: "#6B7280",
  opacity: 0.35,
  rotation: -35,
  position: "center",
};
