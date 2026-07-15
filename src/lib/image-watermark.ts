import {
  createImage,
  isAcceptedImageFile,
  loadImageFileForCrop,
} from "@/lib/crop-image";

export { isAcceptedImageFile, loadImageFileForCrop };

export type WatermarkType = "text" | "logo";

export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type WatermarkFont =
  | "Arial, Helvetica, sans-serif"
  | "Georgia, serif"
  | '"Times New Roman", Times, serif'
  | '"Courier New", Courier, monospace'
  | "Verdana, Geneva, sans-serif"
  | "Impact, Haettenschweiler, sans-serif"
  | "system-ui, sans-serif";

export const WATERMARK_FONTS: Array<{ id: WatermarkFont; label: string }> = [
  { id: "Arial, Helvetica, sans-serif", label: "Arial" },
  { id: "Georgia, serif", label: "Georgia" },
  { id: '"Times New Roman", Times, serif', label: "Times New Roman" },
  { id: '"Courier New", Courier, monospace', label: "Courier New" },
  { id: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { id: "Impact, Haettenschweiler, sans-serif", label: "Impact" },
  { id: "system-ui, sans-serif", label: "System UI" },
];

export const WATERMARK_POSITIONS: WatermarkPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

export type TextWatermarkOptions = {
  type: "text";
  text: string;
  fontFamily: WatermarkFont;
  color: string;
  opacity: number;
  /** Font size as % of the shorter image side (2–40). */
  sizePercent: number;
  position: WatermarkPosition;
  offsetX: number;
  offsetY: number;
};

export type LogoWatermarkOptions = {
  type: "logo";
  logo: HTMLImageElement;
  /** Logo width as % of the base image width (2–80). */
  scalePercent: number;
  opacity: number;
  position: WatermarkPosition;
  offsetX: number;
  offsetY: number;
};

export type WatermarkOptions = TextWatermarkOptions | LogoWatermarkOptions;

const JPEG_QUALITY = 0.92;
const LOGO_AUTO_SCALE_PERCENT = 10;
const MARGIN_RATIO = 0.03;

export function autoScaleLogoPercent(): number {
  return LOGO_AUTO_SCALE_PERCENT;
}

function outputMimeForFile(file: File): { mime: string; quality?: number; extension: string } {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();

  if (type === "image/jpeg" || ext === "jpg" || ext === "jpeg") {
    return { mime: "image/jpeg", quality: JPEG_QUALITY, extension: "jpg" };
  }
  if (type === "image/webp" || ext === "webp") {
    return { mime: "image/webp", quality: JPEG_QUALITY, extension: "webp" };
  }
  if (type === "image/png" || ext === "png") {
    return { mime: "image/png", extension: "png" };
  }
  if (type === "image/gif" || ext === "gif") {
    return { mime: "image/png", extension: "png" };
  }

  return { mime: "image/png", extension: "png" };
}

export function watermarkOutputName(sourceName: string, mime: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  if (mime === "image/jpeg") return `${slug}-watermarked.jpg`;
  if (mime === "image/webp") return `${slug}-watermarked.webp`;
  return `${slug}-watermarked.png`;
}

export function canvasToBlob(canvas: HTMLCanvasElement, file: File): Promise<Blob> {
  const { mime, quality } = outputMimeForFile(file);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export watermarked image."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function zipWatermarkOutputs(
  outputs: Array<{ fileName: string; blob: Blob }>,
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const output of outputs) {
    zip.file(output.fileName, output.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

function resolveAnchor(
  position: WatermarkPosition,
  canvasW: number,
  canvasH: number,
  markW: number,
  markH: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  const marginX = canvasW * MARGIN_RATIO;
  const marginY = canvasH * MARGIN_RATIO;

  let x = marginX;
  let y = marginY;

  switch (position) {
    case "top-left":
      x = marginX;
      y = marginY;
      break;
    case "top-center":
      x = (canvasW - markW) / 2;
      y = marginY;
      break;
    case "top-right":
      x = canvasW - markW - marginX;
      y = marginY;
      break;
    case "middle-left":
      x = marginX;
      y = (canvasH - markH) / 2;
      break;
    case "center":
      x = (canvasW - markW) / 2;
      y = (canvasH - markH) / 2;
      break;
    case "middle-right":
      x = canvasW - markW - marginX;
      y = (canvasH - markH) / 2;
      break;
    case "bottom-left":
      x = marginX;
      y = canvasH - markH - marginY;
      break;
    case "bottom-center":
      x = (canvasW - markW) / 2;
      y = canvasH - markH - marginY;
      break;
    case "bottom-right":
      x = canvasW - markW - marginX;
      y = canvasH - markH - marginY;
      break;
  }

  return {
    x: x + offsetX,
    y: y + offsetY,
  };
}

function hexToRgba(hex: string, opacity: number): string {
  const cleaned = hex.replace("#", "").trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned.padEnd(6, "0").slice(0, 6);
  const r = Number.parseInt(full.slice(0, 2), 16) || 0;
  const g = Number.parseInt(full.slice(2, 4), 16) || 0;
  const b = Number.parseInt(full.slice(4, 6), 16) || 0;
  const a = Math.max(0, Math.min(1, opacity));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Draw base image + watermark onto an existing canvas (resized to image). */
export function renderWatermarkedCanvas(
  canvas: HTMLCanvasElement,
  source: HTMLImageElement,
  options: WatermarkOptions,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

  const width = Math.max(1, source.naturalWidth || source.width);
  const height = Math.max(1, source.naturalHeight || source.height);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  if (options.type === "text") {
    const text = options.text.trim();
    if (!text) return;

    const shorter = Math.min(width, height);
    const fontSize = Math.max(8, Math.round((options.sizePercent / 100) * shorter));
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.font = `600 ${fontSize}px ${options.fontFamily}`;
    ctx.fillStyle = hexToRgba(options.color, options.opacity);
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    const metrics = ctx.measureText(text);
    const markW = metrics.width;
    const markH = fontSize * 1.2;
    const { x, y } = resolveAnchor(
      options.position,
      width,
      height,
      markW,
      markH,
      options.offsetX,
      options.offsetY,
    );
    ctx.fillText(text, x, y);
    ctx.restore();
    return;
  }

  const logo = options.logo;
  const logoW = Math.max(1, logo.naturalWidth || logo.width);
  const logoH = Math.max(1, logo.naturalHeight || logo.height);
  const targetW = Math.max(8, Math.round((options.scalePercent / 100) * width));
  const targetH = Math.max(8, Math.round((targetW / logoW) * logoH));
  const { x, y } = resolveAnchor(
    options.position,
    width,
    height,
    targetW,
    targetH,
    options.offsetX,
    options.offsetY,
  );

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, options.opacity));
  ctx.drawImage(logo, x, y, targetW, targetH);
  ctx.restore();
}

export async function loadBaseImage(file: File): Promise<{
  file: File;
  image: HTMLImageElement;
  objectUrl: string;
  width: number;
  height: number;
}> {
  if (!isAcceptedImageFile(file)) throw new Error("UNSUPPORTED");
  if (file.size === 0) throw new Error("EMPTY");
  const objectUrl = await loadImageFileForCrop(file);
  const image = await createImage(objectUrl);
  return {
    file,
    image,
    objectUrl,
    width: Math.max(1, image.naturalWidth || image.width),
    height: Math.max(1, image.naturalHeight || image.height),
  };
}

export async function loadLogoImage(file: File): Promise<{
  image: HTMLImageElement;
  objectUrl: string;
}> {
  if (!isAcceptedImageFile(file)) throw new Error("UNSUPPORTED_LOGO");
  const objectUrl = await loadImageFileForCrop(file);
  const image = await createImage(objectUrl);
  return { image, objectUrl };
}

export async function watermarkFileToBlob(
  file: File,
  options: WatermarkOptions,
): Promise<{ blob: Blob; fileName: string }> {
  const loaded = await loadBaseImage(file);
  try {
    const canvas = document.createElement("canvas");
    renderWatermarkedCanvas(canvas, loaded.image, options);
    const blob = await canvasToBlob(canvas, file);
    return { blob, fileName: watermarkOutputName(file.name, blob.type) };
  } finally {
    URL.revokeObjectURL(loaded.objectUrl);
  }
}

export function yieldFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}
