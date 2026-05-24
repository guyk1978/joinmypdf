export const PDF_TO_PNG_SCALE = 2.0;

export type PdfPngPage = { page: number; blob: Blob };

/** Render every PDF page to a PNG blob at the given scale (default 2.0). */
export async function pdfToPngPages(file: File, scale = PDF_TO_PNG_SCALE): Promise<PdfPngPage[]> {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  const url = URL.createObjectURL(file);
  try {
    const pdf = await pdfjs.getDocument({ url }).promise;
    const pages: PdfPngPage[] = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported.");
      const task = page.render({ canvasContext: ctx, viewport, canvas } as never);
      await task.promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error(`PNG export failed for page ${i}.`);
      pages.push({ page: i, blob });
    }
    return pages;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function pdfToPngFileName(file: File, page: number) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-page-${page}.png`;
}

export function pdfToPngZipName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-pages.zip`;
}
