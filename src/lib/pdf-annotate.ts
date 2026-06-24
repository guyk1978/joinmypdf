import { PDFDocument } from "pdf-lib-with-encrypt";
import { REDACT_UI_SCALE } from "./pdf-redact";

export type StickyNoteColor = "yellow" | "green" | "violet" | "cyan";

export type PdfHighlight = {
  pageIndex: number;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
  colorHex: string;
};

export type PdfDrawPoint = {
  nx: number;
  ny: number;
};

export type PdfDrawStroke = {
  id: string;
  pageIndex: number;
  colorHex: string;
  /** Line width as fraction of page width (e.g. 0.004). */
  lineWidth: number;
  points: PdfDrawPoint[];
};

export type PdfStickyNote = {
  id: string;
  pageIndex: number;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
  text: string;
  color: StickyNoteColor;
};

export type PdfAnnotationBundle = {
  highlights: PdfHighlight[];
  strokes: PdfDrawStroke[];
  stickies: PdfStickyNote[];
};

export const ANNOTATE_UI_SCALE = REDACT_UI_SCALE;
const FLATTEN_SCALE = 2;

export const HIGHLIGHT_COLORS = [
  { id: "yellow", hex: "#FACC15" },
  { id: "green", hex: "#34D399" },
  { id: "violet", hex: "#A78BFA" },
  { id: "cyan", hex: "#22D3EE" },
  { id: "pink", hex: "#F472B6" },
] as const;

export const STICKY_NOTE_STYLES: Record<
  StickyNoteColor,
  { fill: string; border: string; text: string }
> = {
  yellow: { fill: "rgba(250, 204, 21, 0.88)", border: "#EAB308", text: "#422006" },
  green: { fill: "rgba(163, 163, 163, 0.88)", border: "#10B981", text: "#064E3B" },
  violet: { fill: "rgba(167, 139, 250, 0.88)", border: "#8B5CF6", text: "#2E1065" },
  cyan: { fill: "rgba(34, 211, 238, 0.88)", border: "#06B6D4", text: "#083344" },
};

export const DEFAULT_DRAW_COLOR = "#2563EB";
export const DEFAULT_HIGHLIGHT_COLOR = "#FACC15";

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
          reject(new Error("Failed to encode annotated page."));
          return;
        }
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
      },
      "image/jpeg",
      quality,
    );
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const test = `${line} ${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

export function drawAnnotationsOnCanvas(
  canvas: HTMLCanvasElement,
  pageIndex: number,
  bundle: PdfAnnotationBundle,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  for (const hl of bundle.highlights.filter((item) => item.pageIndex === pageIndex)) {
    ctx.fillStyle = hexToRgba(hl.colorHex, 0.38);
    ctx.fillRect(hl.nx * w, hl.ny * h, hl.nw * w, hl.nh * h);
  }

  for (const stroke of bundle.strokes.filter((item) => item.pageIndex === pageIndex)) {
    if (stroke.points.length < 2) continue;
    ctx.strokeStyle = stroke.colorHex;
    ctx.lineWidth = Math.max(2, stroke.lineWidth * w);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const [first, ...rest] = stroke.points;
    ctx.moveTo(first.nx * w, first.ny * h);
    for (const pt of rest) {
      ctx.lineTo(pt.nx * w, pt.ny * h);
    }
    ctx.stroke();
  }

  for (const note of bundle.stickies.filter((item) => item.pageIndex === pageIndex)) {
    const style = STICKY_NOTE_STYLES[note.color];
    const x = note.nx * w;
    const y = note.ny * h;
    const nw = note.nw * w;
    const nh = note.nh * h;
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, nw, nh);
    ctx.strokeRect(x, y, nw, nh);
    ctx.fillStyle = style.text;
    const fontSize = Math.max(11, Math.min(16, nh * 0.22));
    ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
    ctx.textBaseline = "top";
    const pad = 8;
    const lines = wrapCanvasText(ctx, note.text, nw - pad * 2);
    let ty = y + pad;
    for (const line of lines.slice(0, 6)) {
      ctx.fillText(line, x + pad, ty);
      ty += fontSize * 1.25;
    }
  }
}

export function annotatePdfOutputName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "") || "document";
  return `${base}-annotated.pdf`;
}

export function pagesWithAnnotations(bundle: PdfAnnotationBundle): Set<number> {
  const pages = new Set<number>();
  for (const hl of bundle.highlights) pages.add(hl.pageIndex);
  for (const stroke of bundle.strokes) pages.add(stroke.pageIndex);
  for (const note of bundle.stickies) pages.add(note.pageIndex);
  return pages;
}

/** Bake annotations into affected pages (flatten to JPEG); untouched pages copy verbatim. */
export async function annotatePdfBytes(
  source: Uint8Array,
  bundle: PdfAnnotationBundle,
  options?: { password?: string },
): Promise<Uint8Array> {
  const hasAny =
    bundle.highlights.length > 0 || bundle.strokes.length > 0 || bundle.stickies.length > 0;
  if (!hasAny) throw new Error("Add at least one annotation before downloading.");

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
    throw new Error("This PDF is password-protected. Enter the password to annotate it.");
  }

  const annotatedPages = pagesWithAnnotations(bundle);
  const outDoc = await PDFDocument.create();
  const pageCount = libDoc.getPageCount();

  for (let i = 0; i < pageCount; i += 1) {
    if (annotatedPages.has(i)) {
      const { width, height } = libDoc.getPage(i).getSize();
      const canvas = await renderPdfJsPage(pdfJsDoc, i + 1, FLATTEN_SCALE);
      drawAnnotationsOnCanvas(canvas, i, bundle);
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

export function createAnnotationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ann-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
