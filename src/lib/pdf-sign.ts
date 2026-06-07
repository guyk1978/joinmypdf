import { PDFDocument, StandardFonts } from "pdf-lib-with-encrypt";
import { hexToPdfRgb } from "./add-page-numbers";

/** Signature box in normalized page coordinates (0–1, origin top-left). */
export type NormalizedSignaturePlacement = {
  pageIndex: number;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
};

export type SignatureStamp = {
  signaturePng: Uint8Array;
  placement: NormalizedSignaturePlacement;
};

/** Text label stamped next to a signature (date, name, title). */
export type TextStamp = {
  text: string;
  pageIndex: number;
  nx: number;
  ny: number;
  fontSize: number;
  colorHex?: string;
};

/** Reusable signature stored in workspace state (client-side only). */
export type SavedSignature = {
  id: string;
  dataUrl: string;
  pngBytes: Uint8Array;
  label: string;
};

/** One placed copy of a saved signature on a PDF page. */
export type SignatureInstance = {
  id: string;
  savedId: string;
  pageIndex: number;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
};

export function createSignatureId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sig-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function pngBytesToDataUrl(pngBytes: Uint8Array): Promise<string> {
  const blob = new Blob([pngBytes as BlobPart], { type: "image/png" });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read signature image."));
    reader.readAsDataURL(blob);
  });
}

export function instanceToPlacement(instance: SignatureInstance): NormalizedSignaturePlacement {
  return {
    pageIndex: instance.pageIndex,
    nx: instance.nx,
    ny: instance.ny,
    nw: instance.nw,
    nh: instance.nh,
  };
}

export const SIGN_UI_SCALE = 1.25;

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
  scale = SIGN_UI_SCALE,
): Promise<HTMLCanvasElement> {
  const pdfjs = await setupPdfJs();
  const doc = await pdfjs.getDocument({
    data: source.slice(),
    password: password?.trim() || undefined,
  }).promise;
  return renderPdfJsPage(doc, pageIndex + 1, scale);
}

export function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export signature image."));
          return;
        }
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
      },
      "image/png",
    );
  });
}

/** Render typed name as a transparent PNG with a handwriting-style font. */
export async function createTypedSignaturePng(text: string): Promise<Uint8Array> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Enter your name to create a signature.");

  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");

  const fontSpec = '56px "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive';
  try {
    await document.fonts.load(fontSpec);
  } catch {
    /* system fonts may still render */
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = fontSpec;
  ctx.fillStyle = "#0a0a0a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(trimmed, canvas.width / 2, canvas.height / 2);

  return canvasToPngBytes(canvas);
}

export function defaultSignaturePlacement(pageIndex = 0): NormalizedSignaturePlacement {
  return { pageIndex, nx: 0.32, ny: 0.78, nw: 0.36, nh: 0.1 };
}

export function formatSignatureDate(date = new Date(), locale?: string): string {
  try {
    return date.toLocaleDateString(locale || undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Build text stamps (date, name, title) relative to a signature placement. */
export function buildSignatureTextStamps(
  placement: NormalizedSignaturePlacement,
  options: {
    includeDate?: boolean;
    signerName?: string;
    signerTitle?: string;
    dateText?: string;
  },
): TextStamp[] {
  const stamps: TextStamp[] = [];
  const { pageIndex, nx, ny, nw, nh } = placement;

  if (options.includeDate) {
    stamps.push({
      text: options.dateText || formatSignatureDate(),
      pageIndex,
      nx: clampNorm(nx + nw + 0.015),
      ny: clampNorm(ny + nh * 0.35),
      fontSize: 10,
      colorHex: "#374151",
    });
  }

  const name = options.signerName?.trim();
  if (name) {
    stamps.push({
      text: name,
      pageIndex,
      nx: clampNorm(nx),
      ny: clampNorm(ny + nh + 0.012),
      fontSize: 11,
      colorHex: "#111827",
    });
  }

  const title = options.signerTitle?.trim();
  if (title) {
    stamps.push({
      text: title,
      pageIndex,
      nx: clampNorm(nx),
      ny: clampNorm(ny + nh + (name ? 0.038 : 0.012)),
      fontSize: 9,
      colorHex: "#6B7280",
    });
  }

  return stamps;
}

function clampNorm(v: number) {
  return Math.max(0, Math.min(0.98, v));
}

function pngCacheKey(png: Uint8Array): string {
  let hash = 0;
  const step = Math.max(1, Math.floor(png.length / 32));
  for (let i = 0; i < png.length; i += step) {
    hash = (hash * 31 + png[i]) | 0;
  }
  return `${png.length}-${hash}`;
}

/** Stamp signature images and optional text labels onto PDF pages and save. */
export async function signPdfBytes(
  source: Uint8Array,
  stamps: SignatureStamp[],
  options?: { password?: string; textStamps?: TextStamp[] },
): Promise<Uint8Array> {
  if (!stamps?.length) throw new Error("Place at least one signature on the document.");

  const password = options?.password?.trim() || undefined;
  const textStamps = options?.textStamps ?? [];
  const loadOptions = password ? { password } : {};
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(source, loadOptions);
  } catch {
    doc = await PDFDocument.load(source, { ignoreEncryption: true });
  }

  if (doc.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to sign it.");
  }

  const pageCount = doc.getPageCount();
  const embedded = new Map<string, Awaited<ReturnType<PDFDocument["embedPng"]>>>();

  for (const stamp of stamps) {
    if (!stamp.signaturePng?.length) {
      throw new Error("A signature image is missing.");
    }
    const { placement } = stamp;
    const pageIndex = placement.pageIndex;
    if (pageIndex < 0 || pageIndex >= pageCount) {
      throw new Error("Invalid page for signature placement.");
    }

    const key = pngCacheKey(stamp.signaturePng);
    let image = embedded.get(key);
    if (!image) {
      image = await doc.embedPng(stamp.signaturePng);
      embedded.set(key, image);
    }

    const page = doc.getPage(pageIndex);
    const { width: pageW, height: pageH } = page.getSize();
    const drawW = placement.nw * pageW;
    const drawH = placement.nh * pageH;
    const x = placement.nx * pageW;
    const y = pageH - placement.ny * pageH - drawH;

    page.drawImage(image, { x, y, width: drawW, height: drawH });
  }

  if (textStamps.length) {
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (const label of textStamps) {
      const text = label.text.trim();
      if (!text) continue;
      if (label.pageIndex < 0 || label.pageIndex >= pageCount) continue;
      const page = doc.getPage(label.pageIndex);
      const { width: pageW, height: pageH } = page.getSize();
      const fontSize = Math.max(7, Math.min(label.fontSize, 24));
      const x = clampNorm(label.nx) * pageW;
      const y = pageH - clampNorm(label.ny) * pageH - fontSize;
      page.drawText(text, {
        x,
        y: Math.max(0, y),
        size: fontSize,
        font,
        color: hexToPdfRgb(label.colorHex || "#111827"),
      });
    }
  }

  return doc.save({ useObjectStreams: false });
}

export function signPdfOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-signed.pdf`;
}
