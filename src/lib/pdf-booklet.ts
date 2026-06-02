import { PDFDocument, rgb, type PDFEmbeddedPage, type PDFPage } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "./pdf-errors";

const PT_PER_IN = 72;
const PT_PER_MM = PT_PER_IN / 25.4;

export type BookletPaperPreset = "letter" | "a4" | "legal" | "tabloid";
export type BookletFoldStyle = "saddle-stitch";
export type BookletDuplexFlip = "long-edge" | "short-edge";
export type CustomPaperUnit = "in" | "cm" | "mm";

export type BookletPaperSize = {
  widthPt: number;
  heightPt: number;
  label: string;
};

export const BOOKLET_PAPER_PRESETS: Record<BookletPaperPreset, BookletPaperSize> = {
  letter: { widthPt: 612, heightPt: 792, label: 'US Letter (8.5" × 11")' },
  a4: { widthPt: 595.28, heightPt: 841.89, label: "A4 (210 × 297 mm)" },
  legal: { widthPt: 612, heightPt: 1008, label: 'US Legal (8.5" × 14")' },
  tabloid: { widthPt: 792, heightPt: 1224, label: 'Tabloid / A3 (11" × 17")' },
};

export type BookletOptions = {
  paperPreset: BookletPaperPreset | "custom";
  customWidth?: number;
  customHeight?: number;
  customUnit?: CustomPaperUnit;
  foldStyle: BookletFoldStyle;
  duplexFlip: BookletDuplexFlip;
};

export type BookletSheetSide = {
  side: "front" | "back";
  sheetIndex: number;
  leftPage: number | null;
  rightPage: number | null;
};

export type BookletPlan = {
  sourcePageCount: number;
  paddedPageCount: number;
  sheetCount: number;
  sides: BookletSheetSide[];
  blankPadCount: number;
};

export function padBookletPageCount(pageCount: number): number {
  if (pageCount <= 0) return 4;
  return Math.ceil(pageCount / 4) * 4;
}

/** 1-based page numbers; null = blank padding slot. */
export function buildSaddleStitchPlan(sourcePageCount: number): BookletPlan {
  const paddedPageCount = padBookletPageCount(sourcePageCount);
  const sheetCount = paddedPageCount / 4;
  const sides: BookletSheetSide[] = [];

  for (let s = 0; s < sheetCount; s += 1) {
    sides.push({
      side: "front",
      sheetIndex: s + 1,
      leftPage: paddedPageCount - 2 * s,
      rightPage: 2 * s + 1,
    });
    sides.push({
      side: "back",
      sheetIndex: s + 1,
      leftPage: 2 * s + 2,
      rightPage: paddedPageCount - 2 * s - 1,
    });
  }

  return {
    sourcePageCount,
    paddedPageCount,
    sheetCount,
    sides,
    blankPadCount: Math.max(0, paddedPageCount - sourcePageCount),
  };
}

export function resolveBookletPaperSize(options: BookletOptions): BookletPaperSize {
  if (options.paperPreset !== "custom") {
    return BOOKLET_PAPER_PRESETS[options.paperPreset];
  }
  const unit = options.customUnit || "in";
  const w = Number(options.customWidth) || 8.5;
  const h = Number(options.customHeight) || 11;
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

function fitInBox(
  srcW: number,
  srcH: number,
  boxW: number,
  boxH: number,
): { x: number; y: number; width: number; height: number } {
  const scale = Math.min(boxW / srcW, boxH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return {
    x: (boxW - width) / 2,
    y: (boxH - height) / 2,
    width,
    height,
  };
}

function drawEmbeddedHalf(
  target: PDFPage,
  embedded: PDFEmbeddedPage,
  halfLeft: number,
  paperW: number,
  paperH: number,
) {
  const halfW = paperW / 2;
  const fit = fitInBox(embedded.width, embedded.height, halfW, paperH);
  target.drawPage(embedded, {
    x: halfLeft + fit.x,
    y: fit.y,
    width: fit.width,
    height: fit.height,
  });
}

function drawBlankHalf(target: PDFPage, halfLeft: number, paperW: number, paperH: number) {
  const halfW = paperW / 2;
  target.drawRectangle({
    x: halfLeft + 6,
    y: 6,
    width: halfW - 12,
    height: paperH - 12,
    borderWidth: 1,
    borderColor: rgb(0.75, 0.75, 0.78),
    color: rgb(0.97, 0.97, 0.98),
  });
}

async function drawSheetSide(
  out: PDFDocument,
  source: PDFDocument,
  sourcePageCount: number,
  paperW: number,
  paperH: number,
  leftOneBased: number | null,
  rightOneBased: number | null,
) {
  const sheet = out.addPage([paperW, paperH]);
  const halfW = paperW / 2;
  sheet.drawLine({
    start: { x: halfW, y: 0 },
    end: { x: halfW, y: paperH },
    thickness: 0.5,
    color: rgb(0.82, 0.82, 0.85),
  });

  const drawSlot = async (oneBased: number | null, halfLeft: number) => {
    if (!oneBased || oneBased < 1 || oneBased > sourcePageCount) {
      drawBlankHalf(sheet, halfLeft, paperW, paperH);
      return;
    }
    const embedded = await out.embedPage(source.getPage(oneBased - 1));
    drawEmbeddedHalf(sheet, embedded, halfLeft, paperW, paperH);
  };

  await drawSlot(leftOneBased, 0);
  await drawSlot(rightOneBased, halfW);
}

export type BookletProgress = {
  phase: "loading" | "imposing";
  currentSide: number;
  totalSides: number;
};

export async function createBookletPdf(
  file: File,
  options: BookletOptions,
  onProgress?: (p: BookletProgress) => void,
): Promise<{ bytes: Uint8Array; plan: BookletPlan }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length) throw new Error("That file is empty.");

  try {
    onProgress?.({ phase: "loading", currentSide: 0, totalSides: 0 });
    const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const sourcePageCount = source.getPageCount();
    if (!sourcePageCount) throw new Error("This PDF has no pages.");

    const plan = buildSaddleStitchPlan(sourcePageCount);
    const paper = resolveBookletPaperSize(options);
    const out = await PDFDocument.create();

    let sideIndex = 0;
    for (const side of plan.sides) {
      sideIndex += 1;
      onProgress?.({ phase: "imposing", currentSide: sideIndex, totalSides: plan.sides.length });
      await drawSheetSide(
        out,
        source,
        sourcePageCount,
        paper.widthPt,
        paper.heightPt,
        side.leftPage,
        side.rightPage,
      );
    }

    const output = await out.save({ useObjectStreams: false });
    return { bytes: output, plan };
  } catch (e) {
    throw classifyPdfError(e);
  }
}

export function bookletOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-booklet.pdf`;
}

export function duplexFlipHint(flip: BookletDuplexFlip): string {
  return flip === "long-edge"
    ? "Print duplex with flip on the long edge (standard for portrait booklets)."
    : "Print duplex with flip on the short edge (common for landscape layouts).";
}
