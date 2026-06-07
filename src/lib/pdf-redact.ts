import { PDFDocument } from "pdf-lib-with-encrypt";

/** Redaction rectangle in normalized page coordinates (0–1, origin top-left). */
export type NormalizedRedactionRect = {
  pageIndex: number;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
};

export const REDACT_UI_SCALE = 1.25;
const FLATTEN_SCALE = 2;

async function setupPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

async function renderPdfJsPage(
  pdfDoc: Awaited<ReturnType<Awaited<ReturnType<typeof setupPdfJs>>["getDocument"]>["promise"]>,
  pageNumber: number,
  scale: number,
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;
  return canvas;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.92): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode redacted page."));
          return;
        }
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
      },
      "image/jpeg",
      quality,
    );
  });
}

function drawRedactionsOnCanvas(canvas: HTMLCanvasElement, rects: NormalizedRedactionRect[], pageIndex: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#000000";
  for (const r of rects.filter((box) => box.pageIndex === pageIndex)) {
    ctx.fillRect(r.nx * canvas.width, r.ny * canvas.height, r.nw * canvas.width, r.nh * canvas.height);
  }
}

/** Apply destructive redaction: affected pages are flattened to JPEG with burned-in black boxes. */
export async function redactPdfBytes(
  source: Uint8Array,
  rects: NormalizedRedactionRect[],
  options?: { password?: string },
): Promise<Uint8Array> {
  if (!rects.length) throw new Error("Draw at least one redaction box.");

  const password = options?.password?.trim() || undefined;
  const pdfjs = await setupPdfJs();

  const pdfJsDoc = await pdfjs.getDocument({
    data: source.slice(),
    password,
  }).promise;

  const loadOptions = password ? { password } : {};
  let libDoc: PDFDocument;
  try {
    libDoc = await PDFDocument.load(source, loadOptions);
  } catch {
    libDoc = await PDFDocument.load(source, { ignoreEncryption: true });
  }

  if (libDoc.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to redact it.");
  }

  const outDoc = await PDFDocument.create();
  const pageCount = libDoc.getPageCount();
  const redactedPages = new Set(rects.map((r) => r.pageIndex));

  for (let i = 0; i < pageCount; i += 1) {
    if (redactedPages.has(i)) {
      const { width, height } = libDoc.getPage(i).getSize();
      const canvas = await renderPdfJsPage(pdfJsDoc, i + 1, FLATTEN_SCALE);
      drawRedactionsOnCanvas(canvas, rects, i);
      const jpegBytes = await canvasToJpeg(canvas);
      const image = await outDoc.embedJpg(jpegBytes);
      const page = outDoc.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
    } else {
      const [copied] = await outDoc.copyPages(libDoc, [i]);
      outDoc.addPage(copied);
    }
  }

  return outDoc.save({ useObjectStreams: false });
}

export async function loadPdfPageCount(source: Uint8Array, password?: string): Promise<number> {
  const pdfjs = await setupPdfJs();
  const doc = await pdfjs.getDocument({
    data: source.slice(),
    password: password?.trim() || undefined,
  }).promise;
  return doc.numPages;
}

export async function renderPdfPageForUi(
  source: Uint8Array,
  pageIndex: number,
  password?: string,
  scale = REDACT_UI_SCALE,
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const pdfjs = await setupPdfJs();
  const doc = await pdfjs.getDocument({
    data: source.slice(),
    password: password?.trim() || undefined,
  }).promise;
  const canvas = await renderPdfJsPage(doc, pageIndex + 1, scale);
  return { canvas, width: canvas.width, height: canvas.height };
}

/** Find keyword matches and return normalized redaction rectangles (top-left origin). */
export async function findKeywordRedactionRects(
  source: Uint8Array,
  keyword: string,
  options?: { password?: string; caseSensitive?: boolean },
): Promise<NormalizedRedactionRect[]> {
  const query = keyword.trim();
  if (!query) return [];

  const password = options?.password?.trim() || undefined;
  const caseSensitive = options?.caseSensitive ?? false;
  const pdfjs = await setupPdfJs();
  const doc = await pdfjs.getDocument({
    data: source.slice(),
    password,
  }).promise;

  const rects: NormalizedRedactionRect[] = [];
  const needle = caseSensitive ? query : query.toLowerCase();

  for (let pageIndex = 0; pageIndex < doc.numPages; pageIndex += 1) {
    const page = await doc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (!("str" in item) || typeof item.str !== "string") continue;
      const haystack = caseSensitive ? item.str : item.str.toLowerCase();
      if (!haystack.includes(needle)) continue;

      const transform = item.transform;
      const x = transform[4] ?? 0;
      const y = transform[5] ?? 0;
      const itemWidth =
        typeof (item as { width?: number }).width === "number"
          ? (item as { width: number }).width
          : query.length * 6;
      const itemHeight =
        typeof (item as { height?: number }).height === "number"
          ? (item as { height: number }).height
          : Math.abs(transform[3] ?? 12) || 12;

      const pad = 2;
      const nx = Math.max(0, (x - pad) / pageWidth);
      const ny = Math.max(0, (pageHeight - y - itemHeight - pad) / pageHeight);
      const nw = Math.min(1 - nx, (itemWidth + pad * 2) / pageWidth);
      const nh = Math.min(1 - ny, (itemHeight + pad * 2) / pageHeight);

      if (nw > 0 && nh > 0) {
        rects.push({ pageIndex, nx, ny, nw, nh });
      }
    }
  }

  return rects;
}
