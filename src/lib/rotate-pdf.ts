import { PDFDocument, degrees } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "./pdf-errors";

export type PageRotationAdjustment = {
  pageIndex: number;
  delta: 0 | 90 | 180 | 270 | -90 | -180 | -270;
};

function normalizeRightAngle(angle: number): 0 | 90 | 180 | 270 {
  const snapped = Math.round(angle / 90) * 90;
  const normalized = ((snapped % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) return normalized;
  return 0;
}

export async function rotatePdfBytes(
  file: File,
  adjustments: PageRotationAdjustment[],
): Promise<Uint8Array> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length) throw new Error("That file is empty.");

  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();
    if (!pageCount) throw new Error("This PDF has no pages.");

    const byPage = new Map<number, number>();
    for (const item of adjustments) {
      if (item.pageIndex < 0 || item.pageIndex >= pageCount) continue;
      byPage.set(item.pageIndex, (byPage.get(item.pageIndex) || 0) + item.delta);
    }

    for (let i = 0; i < pageCount; i += 1) {
      const delta = byPage.get(i) || 0;
      if (!delta) continue;
      const page = doc.getPage(i);
      const current = normalizeRightAngle(page.getRotation().angle || 0);
      const next = normalizeRightAngle(current + delta);
      page.setRotation(degrees(next));
    }

    return doc.save({ useObjectStreams: false });
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function rotatePdfOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-rotated.pdf`;
}
