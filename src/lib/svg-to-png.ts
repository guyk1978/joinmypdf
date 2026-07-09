import { classifyPdfError, PdfProcessingError } from "./pdf-errors";
import { createImage, downloadBlob } from "./crop-image";
import { isAcceptedSvgFile, loadSvgPreviewUrl, readSvgFileText } from "./svg-to-favicon";

export { downloadBlob };

const MIME_PNG = "image/png";

export type SvgToPngProgress = {
  phase: "converting" | "packaging";
  currentFile: number;
  totalFiles: number;
  fileName?: string;
};

export type SvgToPngOutput = {
  fileName: string;
  blob: Blob;
};

export function isSvgFile(file: File): boolean {
  return isAcceptedSvgFile(file);
}

export function svgToPngOutputName(file: File): string {
  const base = file.name.replace(/\.svg$/i, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  return `${slug}.png`;
}

function parseSvgLength(value: string | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^([\d.]+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function resolveSvgDimensions(
  svgText: string,
  image: HTMLImageElement,
): { width: number; height: number } {
  const widthAttr = parseSvgLength(svgText.match(/\bwidth\s*=\s*["']([^"']+)["']/i)?.[1]);
  const heightAttr = parseSvgLength(svgText.match(/\bheight\s*=\s*["']([^"']+)["']/i)?.[1]);
  if (widthAttr && heightAttr) {
    return { width: widthAttr, height: heightAttr };
  }

  const viewBoxMatch = svgText.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => Number.isFinite(n));
    if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: Math.round(parts[2]), height: Math.round(parts[3]) };
    }
  }

  const width = Math.max(1, image.naturalWidth || image.width || 512);
  const height = Math.max(1, image.naturalHeight || image.height || 512);
  return { width, height };
}

export async function convertSvgToPngBlob(imageSrc: string, svgText: string): Promise<Blob> {
  const image = await createImage(imageSrc);
  const { width, height } = resolveSvgDimensions(svgText, image);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export PNG."));
          return;
        }
        resolve(blob);
      },
      MIME_PNG,
    );
  });
}

export async function convertSvgFileToPng(file: File): Promise<Blob> {
  const [imageSrc, svgText] = await Promise.all([loadSvgPreviewUrl(file), readSvgFileText(file)]);
  try {
    return await convertSvgToPngBlob(imageSrc, svgText);
  } finally {
    URL.revokeObjectURL(imageSrc);
  }
}

/** Convert SVG files to PNG blobs locally in the browser. */
export async function svgToPng(
  files: File[],
  onProgress?: (progress: SvgToPngProgress) => void,
): Promise<SvgToPngOutput[]> {
  const valid = (files || []).filter(Boolean);
  if (!valid.length) {
    throw new Error("Add at least one SVG image.");
  }

  const svgFiles = valid.filter(isSvgFile);
  if (svgFiles.length !== valid.length) {
    const rejected = valid.find((file) => !isSvgFile(file));
    throw new Error(`"${rejected?.name ?? "File"}" is not an SVG image. Choose .svg files only.`);
  }

  for (const file of svgFiles) {
    if (file.size === 0) {
      throw new Error(`"${file.name}" is empty. Choose another SVG file.`);
    }
  }

  const outputs: SvgToPngOutput[] = [];

  try {
    for (let i = 0; i < svgFiles.length; i++) {
      const file = svgFiles[i];
      onProgress?.({
        phase: "converting",
        currentFile: i + 1,
        totalFiles: svgFiles.length,
        fileName: file.name,
      });

      const blob = await convertSvgFileToPng(file);
      outputs.push({
        fileName: svgToPngOutputName(file),
        blob,
      });
    }

    if (!outputs.length) {
      throw new Error("No PNG images were created. Try different SVG files.");
    }

    return outputs;
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

export async function svgToPngZip(outputs: SvgToPngOutput[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const output of outputs) {
    zip.file(output.fileName, output.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function svgToPngDownloadName(outputs: SvgToPngOutput[]): string {
  if (outputs.length === 1) return outputs[0].fileName;
  return `joinmypdf-svg-png-${outputs.length}-files.zip`;
}
