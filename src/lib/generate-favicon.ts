export type FaviconDesign = {
  text: string;
  backgroundColor: string;
  textColor: string;
};

/** Multi-resolution ICO frames — 64×64 included for Retina / high-DPI tabs. */
export const FAVICON_EXPORT_SIZES = [16, 32, 64] as const;

export const DEFAULT_FAVICON_DESIGN: FaviconDesign = {
  text: "J",
  backgroundColor: "#1a1c21",
  textColor: "#ffffff",
};

export function normalizeFaviconText(value: string): string {
  return value.trim().slice(0, 2);
}

export function drawFaviconOnCanvas(
  ctx: CanvasRenderingContext2D,
  size: number,
  design: FaviconDesign,
): void {
  const text = normalizeFaviconText(design.text);

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = design.backgroundColor;
  ctx.fillRect(0, 0, size, size);

  if (!text) return;

  ctx.fillStyle = design.textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = text.length === 1 ? size * 0.58 : size * 0.42;
  ctx.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.fillText(text.toUpperCase(), size / 2, size / 2 + size * 0.03);
}

export function createFaviconCanvas(size: number, design: FaviconDesign): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  drawFaviconOnCanvas(ctx, size, design);
  return canvas;
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG export failed"));
    }, "image/png");
  });
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await canvasToPngBlob(canvas);
  return new Uint8Array(await blob.arrayBuffer());
}

/** Pack one or more PNG frames into a Windows ICO container (browser-native). */
export async function encodeIcoBlob(
  frames: { size: number; canvas: HTMLCanvasElement }[],
): Promise<Blob> {
  if (!frames.length) throw new Error("No frames to encode");

  const pngFrames: { size: number; data: Uint8Array }[] = [];
  for (const frame of frames) {
    pngFrames.push({
      size: frame.size,
      data: await canvasToPngBytes(frame.canvas),
    });
  }

  const count = pngFrames.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const directory = pngFrames.map((frame) => {
    const entry = {
      width: frame.size,
      height: frame.size,
      bytes: frame.data.length,
      offset,
    };
    offset += frame.data.length;
    return entry;
  });

  const buffer = new ArrayBuffer(offset);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, count, true);

  let entryOffset = 6;
  for (const entry of directory) {
    bytes[entryOffset] = entry.width >= 256 ? 0 : entry.width;
    bytes[entryOffset + 1] = entry.height >= 256 ? 0 : entry.height;
    bytes[entryOffset + 2] = 0;
    bytes[entryOffset + 3] = 0;
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, entry.bytes, true);
    view.setUint32(entryOffset + 12, entry.offset, true);
    entryOffset += 16;
  }

  let dataOffset = headerSize;
  for (const frame of pngFrames) {
    bytes.set(frame.data, dataOffset);
    dataOffset += frame.data.length;
  }

  return new Blob([buffer], { type: "image/x-icon" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function exportFaviconPng(
  design: FaviconDesign,
  size = 32,
): Promise<Blob> {
  const canvas = createFaviconCanvas(size, design);
  return canvasToPngBlob(canvas);
}

export async function exportFaviconIco(design: FaviconDesign): Promise<Blob> {
  const frames = FAVICON_EXPORT_SIZES.map((size) => ({
    size,
    canvas: createFaviconCanvas(size, design),
  }));
  return encodeIcoBlob(frames);
}

export function deriveFaviconAssetPath(text: string, format: "png" | "ico"): string {
  const slug =
    normalizeFaviconText(text)
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, "") || "favicon";
  return `/${slug}-favicon.${format === "ico" ? "ico" : "png"}`;
}

export function buildGenerateFaviconHeaderSnippet(
  path: string,
  format: "png" | "ico",
): string {
  const trimmed = path.trim();
  const href =
    trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `/${trimmed.replace(/^\//, "")}`;

  const comment =
    "<!-- Paste inside <head> — before stylesheets for earliest tab icon discovery -->";
  const tag =
    format === "ico"
      ? `<link rel="icon" href="${href}" type="image/x-icon">`
      : `<link rel="icon" href="${href}" type="image/png">`;

  return `${comment}\n${tag}`;
}
