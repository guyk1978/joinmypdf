/**
 * Image → favicon converter (PNG / JPG / SVG → multi-size ICO or PNG ZIP).
 * Client-side only — reuses canvas packing from generate-favicon / png-to-ico.
 */

import { createImage, loadImageFileForCrop } from "@/lib/crop-image";
import {
  canvasToPngBlob,
  downloadBlob,
  encodeIcoBlob,
} from "@/lib/generate-favicon";
import { drawImageToSquareCanvas } from "@/lib/png-to-ico";
import { isAcceptedSvgFile, loadSvgPreviewUrl } from "@/lib/svg-to-favicon";

export { downloadBlob };

/** Standard favicon frames for this tool (matches common browser tab / shortcut sizes). */
export const FAVICON_GENERATOR_SIZES = [16, 32, 48] as const;
export type FaviconGeneratorSize = (typeof FAVICON_GENERATOR_SIZES)[number];

export type FaviconOutputMode = "ico" | "png-zip";

const ACCEPT_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
]);

const ACCEPT_EXT = /\.(png|jpe?g|svg)$/i;

export function isAcceptedFaviconGeneratorFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (ACCEPT_MIME.has(type)) return true;
  if (isAcceptedSvgFile(file)) return true;
  return ACCEPT_EXT.test(file.name);
}

export async function loadFaviconGeneratorSource(file: File): Promise<string> {
  if (!isAcceptedFaviconGeneratorFile(file)) {
    throw new Error("Unsupported image type");
  }
  if (isAcceptedSvgFile(file)) {
    return loadSvgPreviewUrl(file);
  }
  return loadImageFileForCrop(file);
}

function drawFrames(image: HTMLImageElement, letterbox: boolean) {
  return FAVICON_GENERATOR_SIZES.map((size) => ({
    size,
    canvas: drawImageToSquareCanvas(image, size, {
      letterboxPadding: letterbox,
      letterboxFill: "transparent",
    }),
  }));
}

export async function buildFaviconIcoFromImage(
  imageSrc: string,
  options: { letterbox?: boolean } = {},
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const frames = drawFrames(image, options.letterbox ?? true);
  return encodeIcoBlob(frames);
}

export async function buildFaviconPngZipFromImage(
  imageSrc: string,
  options: { letterbox?: boolean } = {},
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const frames = drawFrames(image, options.letterbox ?? true);
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  for (const frame of frames) {
    const png = await canvasToPngBlob(frame.canvas);
    zip.file(`favicon-${frame.size}x${frame.size}.png`, await png.arrayBuffer());
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export function faviconGeneratorOutputName(
  sourceName: string,
  mode: FaviconOutputMode,
): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "favicon";
  const safe = base.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 80);
  if (mode === "ico") return `${safe}.ico`;
  return `${safe}-favicon-pngs.zip`;
}

export function buildFaviconGeneratorHeaderSnippet(mode: FaviconOutputMode): string {
  if (mode === "ico") {
    return [
      "<!-- Paste inside <head> -->",
      '<link rel="icon" href="/favicon.ico" sizes="any">',
      '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
      '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
    ].join("\n");
  }
  return [
    "<!-- Paste inside <head> — place PNGs in your site root or /public -->",
    '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
  ].join("\n");
}
