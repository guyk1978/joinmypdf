import { classifyPdfError } from "./pdf-errors";
import {
  extractPageFragments,
  fragmentsToParagraphs,
  loadPdfDocument,
} from "./pdf-text-extract";
import { formatBytes } from "./pdf-to-word";

export { formatBytes };

export type PdfToPowerpointProgress = {
  phase: "loading" | "extracting" | "building";
  currentPage: number;
  totalPages: number;
};

export async function convertPdfToPptx(
  file: File,
  onProgress?: (progress: PdfToPowerpointProgress) => void,
): Promise<Blob> {
  if (file.size === 0) {
    throw new Error("That file is empty. Choose another PDF.");
  }

  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });

  try {
    const doc = await loadPdfDocument(file);
    const totalPages = doc.numPages;
    const pptxgen = (await import("pptxgenjs")).default;
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_16x9";
    pptx.author = "JoinMyPDF";

    let extractedSlides = 0;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      onProgress?.({ phase: "extracting", currentPage: pageNumber, totalPages });
      const page = await doc.getPage(pageNumber);
      const fragments = await extractPageFragments(page);
      const paragraphs = fragmentsToParagraphs(fragments);

      const slide = pptx.addSlide();
      slide.addText(`Page ${pageNumber}`, {
        x: 0.5,
        y: 0.35,
        w: 9,
        h: 0.6,
        fontSize: 18,
        bold: true,
        color: "1E293B",
      });

      if (!paragraphs.length) {
        slide.addText("[No extractable text on this page — it may be scanned or image-only.]", {
          x: 0.6,
          y: 1.2,
          w: 8.8,
          h: 4.5,
          fontSize: 14,
          italic: true,
          color: "64748B",
        });
        continue;
      }

      extractedSlides++;
      slide.addText(paragraphs.join("\n\n"), {
        x: 0.6,
        y: 1.2,
        w: 8.8,
        h: 4.8,
        fontSize: 14,
        color: "0F172A",
        valign: "top",
      });
    }

    if (extractedSlides === 0) {
      throw new Error(
        "No text could be extracted. This PDF may be scanned or image-based—try a PDF with selectable text.",
      );
    }

    onProgress?.({ phase: "building", currentPage: totalPages, totalPages });
    const blob = (await pptx.write({ outputType: "blob" })) as Blob;
    return blob;
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function pdfToPowerpointOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return `joinmypdf-${slug}.pptx`;
}
