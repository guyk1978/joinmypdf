import { PDFDocument } from "pdf-lib-with-encrypt";
import {
  loadPdfPageCount as sharedLoadPdfPageCount,
  PDF_THUMB_SCALE,
  renderPdfPageThumbnail as sharedRenderPdfPageThumbnail,
} from "@/lib/pdf-render";

export const DELETE_PAGES_THUMB_SCALE = PDF_THUMB_SCALE;

export async function loadPdfPageCount(source: Uint8Array, password?: string): Promise<number> {
  return sharedLoadPdfPageCount(source, password);
}

export async function renderPdfPageThumbnail(
  source: Uint8Array,
  pageIndex: number,
  password?: string,
  scale = DELETE_PAGES_THUMB_SCALE,
): Promise<HTMLCanvasElement> {
  return sharedRenderPdfPageThumbnail(source, pageIndex, password, scale);
}

/** Remove pages by 0-based indices (deleted high → low). */
export async function deletePdfPagesBytes(
  source: Uint8Array,
  pageIndicesToRemove: number[],
): Promise<Uint8Array> {
  if (!pageIndicesToRemove.length) {
    throw new Error("Select at least one page to delete.");
  }

  const doc = await PDFDocument.load(source, { ignoreEncryption: true });
  if (doc.isEncrypted) {
    throw new Error("This PDF is password-protected. Unlock it before deleting pages.");
  }
  const total = doc.getPageCount();
  const unique = [...new Set(pageIndicesToRemove)].filter((i) => i >= 0 && i < total);

  if (!unique.length) {
    throw new Error("No valid pages selected for deletion.");
  }
  if (unique.length >= total) {
    throw new Error("You cannot delete every page. Keep at least one page.");
  }

  const sorted = unique.sort((a, b) => b - a);
  for (const index of sorted) {
    doc.removePage(index);
  }

  return doc.save({ useObjectStreams: false });
}
