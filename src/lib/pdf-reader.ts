/** Client-side PDF.js helpers for the PDF Reader Online tool. */

export type PdfJsDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
  destroy: () => Promise<void>;
};

type PdfJsPage = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
    canvas: HTMLCanvasElement;
  }) => { promise: Promise<void> };
  getTextContent: () => Promise<unknown>;
};

type PdfJsModule = {
  version?: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (params: { data: Uint8Array; password?: string }) => { promise: Promise<PdfJsDocument> };
  TextLayer: new (params: {
    textContentSource: unknown;
    container: HTMLElement;
    viewport: { width: number; height: number };
  }) => { render: () => Promise<void>; cancel: () => void };
};

let pdfjsModule: PdfJsModule | null = null;

export async function setupPdfJs(): Promise<PdfJsModule> {
  if (pdfjsModule) return pdfjsModule;
  const pdfjs = (await import("pdfjs-dist")) as unknown as PdfJsModule;
  const version = pdfjs.version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  pdfjsModule = pdfjs;
  return pdfjs;
}

export async function openPdfDocument(
  source: Uint8Array,
  password?: string,
): Promise<PdfJsDocument> {
  const pdfjs = await setupPdfJs();
  return pdfjs.getDocument({
    data: source.slice(),
    password: password?.trim() || undefined,
  }).promise;
}

export async function renderPdfReaderPage(options: {
  doc: PdfJsDocument;
  pageNumber: number;
  scale: number;
  canvas: HTMLCanvasElement;
  textLayerEl: HTMLElement | null;
}): Promise<{ width: number; height: number }> {
  const { doc, pageNumber, scale, canvas, textLayerEl } = options;
  const pdfjs = await setupPdfJs();
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  } as never).promise;

  if (textLayerEl) {
    textLayerEl.replaceChildren();
    textLayerEl.style.width = `${viewport.width}px`;
    textLayerEl.style.height = `${viewport.height}px`;
    const textContent = await page.getTextContent();
    const layer = new pdfjs.TextLayer({
      textContentSource: textContent,
      container: textLayerEl,
      viewport,
    });
    await layer.render();
  }

  return { width: viewport.width, height: viewport.height };
}
