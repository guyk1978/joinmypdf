import { classifyPdfError } from "./pdf-errors";
import { extractPageFragments, fragmentsToParagraphs, loadPdfDocument } from "./pdf-text-extract";

export type PdfToTextProgress = {
  phase: "loading" | "extracting" | "building";
  currentPage: number;
  totalPages: number;
};

export async function convertPdfToText(
  file: File,
  onProgress?: (progress: PdfToTextProgress) => void,
): Promise<Blob> {
  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });

  try {
    const doc = await loadPdfDocument(file);
    const totalPages = doc.numPages;
    const pageBlocks: string[] = [];
    let extractedBlocks = 0;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      onProgress?.({ phase: "extracting", currentPage: pageNumber, totalPages });
      const page = await doc.getPage(pageNumber);
      const fragments = await extractPageFragments(page);
      const paragraphs = fragmentsToParagraphs(fragments);

      if (!paragraphs.length) {
        pageBlocks.push(`Page ${pageNumber}\n[No extractable text on this page - it may be scanned or image-only.]`);
        continue;
      }

      extractedBlocks += paragraphs.length;
      pageBlocks.push(`Page ${pageNumber}\n${paragraphs.join("\n\n")}`);
    }

    if (extractedBlocks === 0) {
      throw new Error(
        "No text could be extracted. This PDF may be scanned or image-based-try a PDF with selectable text.",
      );
    }

    onProgress?.({ phase: "building", currentPage: totalPages, totalPages });
    return new Blob([pageBlocks.join("\n\n---\n\n")], { type: "text/plain;charset=utf-8" });
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function pdfToTextOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return `joinmypdf-${slug}.txt`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
