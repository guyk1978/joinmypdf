import { createImage, loadImageFileForCrop } from "@/lib/crop-image";
import { normalizeFaviconPath } from "@/lib/favicon-code-generator";
import {
  encodeIcoBlob,
  FAVICON_EXPORT_SIZES,
  downloadBlob,
} from "@/lib/generate-favicon";

export { downloadBlob };

const PNG_MIME = "image/png";

export function isAcceptedPngFile(file: File): boolean {
  if (file.type === PNG_MIME) return true;
  return /\.png$/i.test(file.name);
}

export function pngToIcoOutputName(sourceName: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "favicon";
  return `${base}.ico`;
}

export function derivePngToIcoAssetPath(outputFilename: string): string {
  const trimmed = outputFilename.trim() || "favicon.ico";
  if (trimmed.includes("/")) {
    return normalizeFaviconPath(trimmed);
  }
  const name = trimmed.endsWith(".ico") ? trimmed : `${trimmed.replace(/\.[^.]+$/, "") || "favicon"}.ico`;
  return normalizeFaviconPath(name);
}

export function buildPngToIcoHeaderSnippet(iconPath: string): string {
  const href = normalizeFaviconPath(iconPath);
  return `<link rel="icon" href="${href}" type="image/x-icon">`;
}

export type DrawImageToSquareOptions = {
  /** When true, fit the image inside the square with padding bars (no stretch). */
  letterboxPadding?: boolean;
  /** Background fill when letterboxing. Defaults to `#000000`. Use `"transparent"` for PNG exports. */
  letterboxFill?: string;
};

export type PngToIcoConvertOptions = {
  /** Preserve aspect ratio with black padding instead of center-cropping to fill the square. */
  maintainAspectRatioWithPadding?: boolean;
};

export function drawImageToSquareCanvas(
  image: HTMLImageElement,
  size: number,
  options: DrawImageToSquareOptions = {},
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

  const width = Math.max(1, image.naturalWidth);
  const height = Math.max(1, image.naturalHeight);
  const letterbox = options.letterboxPadding ?? false;
  const scale = letterbox
    ? Math.min(size / width, size / height)
    : Math.max(size / width, size / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  const offsetX = (size - drawWidth) / 2;
  const offsetY = (size - drawHeight) / 2;

  ctx.clearRect(0, 0, size, size);
  if (letterbox) {
    const fill = options.letterboxFill ?? "#000000";
    if (fill !== "transparent") {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, size, size);
    }
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  return canvas;
}

export async function convertPngImageToIco(
  imageSrc: string,
  options: PngToIcoConvertOptions = {},
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const letterboxPadding = options.maintainAspectRatioWithPadding ?? true;
  const frames = FAVICON_EXPORT_SIZES.map((size) => ({
    size,
    canvas: drawImageToSquareCanvas(image, size, { letterboxPadding }),
  }));
  return encodeIcoBlob(frames);
}

export async function convertPngFileToIco(
  file: File,
  options: PngToIcoConvertOptions = {},
): Promise<Blob> {
  if (!isAcceptedPngFile(file)) {
    throw new Error("Invalid PNG file.");
  }
  const imageSrc = await loadImageFileForCrop(file);
  try {
    return await convertPngImageToIco(imageSrc, options);
  } finally {
    URL.revokeObjectURL(imageSrc);
  }
}

export async function loadPngFileForPreview(file: File): Promise<string> {
  if (!isAcceptedPngFile(file)) {
    throw new Error("Invalid PNG file.");
  }
  return loadImageFileForCrop(file);
}

export type PngToIcoBatchOutput = {
  fileName: string;
  blob: Blob;
};

export type PngToIcoBatchProgress = {
  current: number;
  total: number;
  fileName?: string;
};

const BATCH_CONCURRENCY = 3;

/** Convert multiple PNG files locally with bounded parallelism. */
export async function convertPngFilesToIco(
  files: File[],
  options: PngToIcoConvertOptions = {},
  onItem?: (update: {
    index: number;
    total: number;
    fileName: string;
    status: "processing" | "done" | "error";
    output?: PngToIcoBatchOutput;
  }) => void,
): Promise<PngToIcoBatchOutput[]> {
  const valid = files.filter(isAcceptedPngFile);
  if (!valid.length) {
    throw new Error("Add at least one PNG file.");
  }

  const results: (PngToIcoBatchOutput | null)[] = new Array(valid.length).fill(null);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= valid.length) break;

      const file = valid[index];
      onItem?.({ index, total: valid.length, fileName: file.name, status: "processing" });

      try {
        const blob = await convertPngFileToIco(file, options);
        const output = { fileName: pngToIcoOutputName(file.name), blob };
        results[index] = output;
        onItem?.({ index, total: valid.length, fileName: file.name, status: "done", output });
      } catch {
        onItem?.({ index, total: valid.length, fileName: file.name, status: "error" });
      }
    }
  }

  const workers = Math.min(BATCH_CONCURRENCY, valid.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results.filter((output): output is PngToIcoBatchOutput => output !== null);
}

export async function pngToIcoZip(outputs: PngToIcoBatchOutput[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const output of outputs) {
    zip.file(output.fileName, output.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function pngToIcoBatchDownloadName(outputCount: number): string {
  if (outputCount === 1) return "favicon.ico";
  return `joinmypdf-png-ico-${outputCount}-files.zip`;
}
