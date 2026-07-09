import {
  createImage,
  isAcceptedImageFile,
  loadImageFileForCrop,
} from "./crop-image";
import { classifyPdfError, PdfProcessingError } from "./pdf-errors";
import { compressionSavingsPercent } from "./compress-image";

export { isAcceptedImageFile, compressionSavingsPercent };

export type OptimizerOutputFormat = "webp" | "jpg" | "png";

export type OptimizeImageOptions = {
  format: OptimizerOutputFormat;
  qualityPercent: number;
  stripMetadata: boolean;
  onProgress?: (percent: number) => void;
};

export type OptimizeImageResult = {
  blob: Blob;
  fileName: string;
  originalBytes: number;
  outputBytes: number;
  savingsPercent: number;
  outputFormat: OptimizerOutputFormat;
};

const MIN_QUALITY = 1;
const MAX_QUALITY = 100;
const DEFAULT_QUALITY = 85;

export function clampOptimizerQuality(percent: number): number {
  if (!Number.isFinite(percent)) return DEFAULT_QUALITY;
  return Math.min(MAX_QUALITY, Math.max(MIN_QUALITY, Math.round(percent)));
}

export function detectImageFormatLabel(file: File): string {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toUpperCase();
  if (type === "image/jpeg" || ext === "JPG" || ext === "JPEG") return "JPEG";
  if (type === "image/png" || ext === "PNG") return "PNG";
  if (type === "image/webp" || ext === "WEBP") return "WEBP";
  if (type === "image/gif" || ext === "GIF") return "GIF";
  if (type === "image/heic" || type === "image/heif" || ext === "HEIC" || ext === "HEIF") {
    return "HEIC";
  }
  if (type === "image/bmp" || ext === "BMP") return "BMP";
  return ext || "IMAGE";
}

function outputMime(format: OptimizerOutputFormat): string {
  if (format === "webp") return "image/webp";
  if (format === "jpg") return "image/jpeg";
  return "image/png";
}

export function optimizerOutputName(sourceName: string, format: OptimizerOutputFormat): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  const extension = format === "webp" ? "webp" : format === "jpg" ? "jpg" : "png";
  return `${slug}-optimized.${extension}`;
}

function isHeicFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  return type === "image/heic" || type === "image/heif" || ext === "heic" || ext === "heif";
}

async function normalizeProcessableFile(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;

  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 1 });
  const blob = Array.isArray(result) ? result[0] : result;
  if (!(blob instanceof Blob)) {
    throw new Error("Failed to decode HEIC image.");
  }

  const name = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], name, { type: "image/jpeg" });
}

async function exportPngBlob(file: File, onProgress?: (percent: number) => void): Promise<Blob> {
  onProgress?.(15);
  const imageSrc = await loadImageFileForCrop(file);
  try {
    onProgress?.(45);
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas rendering is not supported in this browser.");
    }

    const width = Math.max(1, image.naturalWidth || image.width);
    const height = Math.max(1, image.naturalHeight || image.height);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    onProgress?.(80);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to export PNG image."));
            return;
          }
          onProgress?.(100);
          resolve(blob);
        },
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(imageSrc);
  }
}

async function compressWithBrowserLibrary(
  file: File,
  format: OptimizerOutputFormat,
  qualityPercent: number,
  stripMetadata: boolean,
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const imageCompression = (await import("browser-image-compression")).default;
  const quality = clampOptimizerQuality(qualityPercent) / 100;

  const compressed = await imageCompression(file, {
    maxSizeMB: 50,
    maxWidthOrHeight: 8192,
    useWebWorker: true,
    fileType: outputMime(format),
    initialQuality: quality,
    preserveExif: !stripMetadata,
    onProgress: (progress) => onProgress?.(Math.min(99, Math.round(progress))),
  });

  onProgress?.(100);
  return compressed;
}

/** Optimize or convert a single image locally in the browser. */
export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions,
): Promise<OptimizeImageResult> {
  if (!isAcceptedImageFile(file)) {
    throw new Error(`"${file.name}" is not a supported image.`);
  }
  if (file.size === 0) {
    throw new Error(`"${file.name}" is empty.`);
  }

  const { format, qualityPercent, stripMetadata, onProgress } = options;
  const originalBytes = file.size;

  try {
    const processable = await normalizeProcessableFile(file);
    onProgress?.(5);

    let blob: Blob;
    if (format === "png") {
      blob = await exportPngBlob(processable, onProgress);
    } else {
      blob = await compressWithBrowserLibrary(
        processable,
        format,
        qualityPercent,
        stripMetadata,
        onProgress,
      );
    }

    const outputBytes = blob.size;
    return {
      blob,
      fileName: optimizerOutputName(file.name, format),
      originalBytes,
      outputBytes,
      savingsPercent: compressionSavingsPercent(originalBytes, outputBytes),
      outputFormat: format,
    };
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

export async function imageOptimizerZip(
  outputs: Array<{ fileName: string; blob: Blob }>,
): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const output of outputs) {
    zip.file(output.fileName, output.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function imageOptimizerDownloadName(outputs: Array<{ fileName: string }>): string {
  if (outputs.length === 1) return outputs[0]!.fileName;
  return `joinmypdf-optimized-${outputs.length}-files.zip`;
}
