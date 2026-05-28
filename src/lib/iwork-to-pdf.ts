import { classifyPdfError } from "./pdf-errors";
import { formatBytes } from "./pdf-to-word";

export { formatBytes };

export type IworkProgressPhase = "reading" | "extracting" | "complete";
export type IworkKind = "pages" | "numbers" | "keynote";

export const IWORK_PREVIEW_MISSING_MESSAGE =
  "This iWork file does not include QuickLook/Preview.pdf. In Pages, Numbers, or Keynote, export/save the file with preview enabled, then try again.";

export function detectIworkKind(file: File): IworkKind | null {
  if (/\.pages$/i.test(file.name)) return "pages";
  if (/\.numbers$/i.test(file.name)) return "numbers";
  if (/\.key$/i.test(file.name) || /\.keynote$/i.test(file.name)) return "keynote";
  return null;
}

export function isIworkFile(file: File): boolean {
  return detectIworkKind(file) !== null;
}

export function iworkKindLabel(kind: IworkKind): string {
  if (kind === "pages") return "Apple Pages";
  if (kind === "numbers") return "Apple Numbers";
  return "Apple Keynote";
}

export async function extractIworkPreviewPdfBytes(
  file: File,
  onProgress?: (phase: IworkProgressPhase, percent: number) => void,
): Promise<Uint8Array> {
  if (!isIworkFile(file)) {
    throw new Error("Please upload a .pages, .numbers, or .keynote file.");
  }
  if (file.size === 0) {
    throw new Error("That iWork file is empty.");
  }

  onProgress?.("reading", 18);

  try {
    const source = await file.arrayBuffer();
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(source);

    onProgress?.("extracting", 58);

    const previewEntry = zip.file("QuickLook/Preview.pdf");
    if (!previewEntry) {
      throw new Error(IWORK_PREVIEW_MISSING_MESSAGE);
    }

    const bytes = new Uint8Array(await previewEntry.async("uint8array"));
    if (!bytes.length) {
      throw new Error("QuickLook preview was found, but the embedded PDF is empty.");
    }

    onProgress?.("complete", 95);
    return bytes;
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function iworkToPdfOutputName(file: File): string {
  const base = file.name.replace(/\.(pages|numbers|key|keynote)$/i, "") || "document";
  const safe = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return `joinmypdf-${safe}.pdf`;
}
