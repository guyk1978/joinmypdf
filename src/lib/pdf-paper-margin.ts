import { PDFDocument, rgb } from "pdf-lib-with-encrypt";
import {
  clampCropRect,
  normalizedToPdfCropBox,
  type NormalizedCropRect,
} from "./crop-pdf";
import { classifyPdfError } from "./pdf-errors";

const PT_PER_IN = 72;
const PT_PER_MM = PT_PER_IN / 25.4;

export type TargetPaperPreset = "a4" | "a5" | "b5" | "letter" | "legal";
export type MarginUnit = "mm" | "in";
export type CustomPaperUnit = "mm" | "in" | "cm";

export type TargetPaperSize = {
  widthPt: number;
  heightPt: number;
  label: string;
};

export const TARGET_PAPER_PRESETS: Record<TargetPaperPreset, TargetPaperSize> = {
  a4: { widthPt: 595.28, heightPt: 841.89, label: "A4 (210 × 297 mm)" },
  a5: { widthPt: 419.53, heightPt: 595.28, label: "A5 (148 × 210 mm)" },
  b5: { widthPt: 498.9, heightPt: 708.66, label: "B5 (176 × 250 mm)" },
  letter: { widthPt: 612, heightPt: 792, label: 'US Letter (8.5" × 11")' },
  legal: { widthPt: 612, heightPt: 1008, label: 'US Legal (8.5" × 14")' },
};

export type MarginInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type PaperMarginOptions = {
  paperPreset: TargetPaperPreset | "custom";
  customWidth?: number;
  customHeight?: number;
  customUnit?: CustomPaperUnit;
  margins: MarginInsets;
  marginUnit: MarginUnit;
  sourceCrop: NormalizedCropRect;
};

export function marginToPt(value: number, unit: MarginUnit): number {
  if (unit === "in") return value * PT_PER_IN;
  return value * PT_PER_MM;
}

export function marginsToPt(margins: MarginInsets, unit: MarginUnit) {
  return {
    top: marginToPt(margins.top, unit),
    right: marginToPt(margins.right, unit),
    bottom: marginToPt(margins.bottom, unit),
    left: marginToPt(margins.left, unit),
  };
}

export function resolveTargetPaper(options: Pick<PaperMarginOptions, "paperPreset" | "customWidth" | "customHeight" | "customUnit">): TargetPaperSize {
  if (options.paperPreset !== "custom") {
    return TARGET_PAPER_PRESETS[options.paperPreset];
  }
  const unit = options.customUnit || "mm";
  const w = Number(options.customWidth) || 210;
  const h = Number(options.customHeight) || 297;
  let widthPt = w;
  let heightPt = h;
  if (unit === "in") {
    widthPt = w * PT_PER_IN;
    heightPt = h * PT_PER_IN;
  } else if (unit === "cm") {
    widthPt = w * 10 * PT_PER_MM;
    heightPt = h * 10 * PT_PER_MM;
  } else {
    widthPt = w * PT_PER_MM;
    heightPt = h * PT_PER_MM;
  }
  const label =
    unit === "in"
      ? `Custom (${w}" × ${h}")`
      : unit === "cm"
        ? `Custom (${w} × ${h} cm)`
        : `Custom (${w} × ${h} mm)`;
  return { widthPt, heightPt, label };
}

export function marginFractions(
  paper: Pick<TargetPaperSize, "widthPt" | "heightPt">,
  marginsPt: ReturnType<typeof marginsToPt>,
): { top: number; right: number; bottom: number; left: number } {
  return {
    top: marginsPt.top / paper.heightPt,
    right: marginsPt.right / paper.widthPt,
    bottom: marginsPt.bottom / paper.heightPt,
    left: marginsPt.left / paper.widthPt,
  };
}

export const DEFAULT_MARGINS_MM: MarginInsets = {
  top: 12,
  right: 12,
  bottom: 12,
  left: 12,
};

export const DEFAULT_SOURCE_CROP: NormalizedCropRect = {
  nx: 0,
  ny: 0,
  nw: 1,
  nh: 1,
};

function applyCropToDocument(doc: PDFDocument, crop: NormalizedCropRect) {
  const rect = clampCropRect(crop);
  const pageCount = doc.getPageCount();
  for (let i = 0; i < pageCount; i += 1) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const box = normalizedToPdfCropBox(width, height, rect);
    page.setCropBox(box.x, box.y, box.width, box.height);
    page.setMediaBox(box.x, box.y, box.width, box.height);
  }
}

export async function applyPaperMarginBytes(
  file: File,
  options: PaperMarginOptions,
): Promise<Uint8Array> {
  if (!file) throw new Error("Choose a PDF file.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length) throw new Error("That file is empty.");

  try {
    const paper = resolveTargetPaper(options);
    const marginsPt = marginsToPt(options.margins, options.marginUnit);
    const contentW = paper.widthPt - marginsPt.left - marginsPt.right;
    const contentH = paper.heightPt - marginsPt.top - marginsPt.bottom;
    if (contentW < 24 || contentH < 24) {
      throw new Error("Margins are too large for the selected paper size.");
    }

    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = src.getPageCount();
    if (!pageCount) throw new Error("This PDF has no pages.");

    applyCropToDocument(src, options.sourceCrop);

    const out = await PDFDocument.create();

    for (let i = 0; i < pageCount; i += 1) {
      const embedded = await out.embedPage(src.getPage(i));
      const page = out.addPage([paper.widthPt, paper.heightPt]);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: paper.widthPt,
        height: paper.heightPt,
        color: rgb(1, 1, 1),
      });

      const scale = Math.min(contentW / embedded.width, contentH / embedded.height);
      const drawW = embedded.width * scale;
      const drawH = embedded.height * scale;
      const x = marginsPt.left + (contentW - drawW) / 2;
      const y = marginsPt.bottom + (contentH - drawH) / 2;

      page.drawPage(embedded, { x, y, width: drawW, height: drawH });
    }

    return out.save({ useObjectStreams: false });
  } catch (e) {
    throw classifyPdfError(e);
  }
}

export function paperMarginOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-sized.pdf`;
}
