import { classifyPdfError } from "./pdf-errors";
import {
  extractPageFragments,
  fragmentsToGrid,
  loadPdfDocument,
} from "./pdf-text-extract";
import { formatBytes } from "./pdf-to-word";

export { formatBytes };

export type PdfToExcelProgress = {
  phase: "loading" | "extracting" | "building";
  currentPage: number;
  totalPages: number;
};

function sanitizeSheetName(name: string, used: Set<string>): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Sheet";
  let candidate = cleaned;
  let index = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` ${index}`;
    candidate = `${cleaned.slice(0, 31 - suffix.length)}${suffix}`;
    index++;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export async function convertPdfToExcel(
  file: File,
  onProgress?: (progress: PdfToExcelProgress) => void,
): Promise<Blob> {
  if (file.size === 0) {
    throw new Error("That file is empty. Choose another PDF.");
  }

  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });

  try {
    const doc = await loadPdfDocument(file);
    const totalPages = doc.numPages;
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    const usedSheetNames = new Set<string>();
    let populatedSheets = 0;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      onProgress?.({ phase: "extracting", currentPage: pageNumber, totalPages });
      const page = await doc.getPage(pageNumber);
      const fragments = await extractPageFragments(page);
      const grid = fragmentsToGrid(fragments);

      const rows =
        grid.length > 0
          ? grid
          : [["[No extractable text on this page — it may be scanned or image-only.]"]];

      if (grid.length > 0) populatedSheets++;

      const sheet = XLSX.utils.aoa_to_sheet(rows);
      const sheetName = sanitizeSheetName(`Page ${pageNumber}`, usedSheetNames);
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    }

    if (populatedSheets === 0) {
      throw new Error(
        "No text could be extracted. This PDF may be scanned or image-based—try a PDF with selectable text.",
      );
    }

    onProgress?.({ phase: "building", currentPage: totalPages, totalPages });
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    return new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function pdfToExcelOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return `joinmypdf-${slug}.xlsx`;
}
