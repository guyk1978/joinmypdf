import { classifyPdfError, PdfProcessingError } from "./pdf-errors";
import {
  createImage,
  downloadBlob,
  isAcceptedImageFile,
  loadImageFileForCrop,
} from "./crop-image";

export { downloadBlob, isAcceptedImageFile };

export type ImageGrayscaleProgress = {
  phase: "converting" | "packaging";
  currentFile: number;
  totalFiles: number;
  fileName?: string;
};

export type ImageGrayscaleOutput = {
  fileName: string;
  blob: Blob;
};

const JPEG_QUALITY = 0.92;

function isPngSource(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  return type === "image/png" || ext === "png";
}

function isJpegSource(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  return type === "image/jpeg" || ext === "jpg" || ext === "jpeg";
}

function applyGrayscaleFilter(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    const value = Math.round(gray);
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);
}

function outputFormatForGrayscale(file: File): { mime: string; quality?: number; extension: string } {
  if (isPngSource(file)) {
    return { mime: "image/png", extension: "png" };
  }
  if (isJpegSource(file)) {
    return { mime: "image/jpeg", quality: JPEG_QUALITY, extension: "jpg" };
  }
  return { mime: "image/jpeg", quality: JPEG_QUALITY, extension: "jpg" };
}

export function imageGrayscaleOutputName(file: File): string {
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  const { extension } = outputFormatForGrayscale(file);
  return `${slug}-grayscale.${extension}`;
}

export async function convertImageToGrayscaleBlob(imageSrc: string, file: File): Promise<Blob> {
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
  applyGrayscaleFilter(ctx, width, height);

  const { mime, quality } = outputFormatForGrayscale(file);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export grayscale image."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}

export async function convertImageFileToGrayscale(file: File): Promise<Blob> {
  const imageSrc = await loadImageFileForCrop(file);
  try {
    return await convertImageToGrayscaleBlob(imageSrc, file);
  } finally {
    URL.revokeObjectURL(imageSrc);
  }
}

/** Convert color images to grayscale locally in the browser. */
export async function imageGrayscale(
  files: File[],
  onProgress?: (progress: ImageGrayscaleProgress) => void,
): Promise<ImageGrayscaleOutput[]> {
  const valid = (files || []).filter(Boolean);
  if (!valid.length) {
    throw new Error("Add at least one image.");
  }

  const imageFiles = valid.filter(isAcceptedImageFile);
  if (imageFiles.length !== valid.length) {
    const rejected = valid.find((file) => !isAcceptedImageFile(file));
    throw new Error(
      `"${rejected?.name ?? "File"}" is not a supported image. Choose JPG, PNG, WebP, GIF, or HEIC files.`,
    );
  }

  for (const file of imageFiles) {
    if (file.size === 0) {
      throw new Error(`"${file.name}" is empty. Choose another image.`);
    }
  }

  const outputs: ImageGrayscaleOutput[] = [];

  try {
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      onProgress?.({
        phase: "converting",
        currentFile: i + 1,
        totalFiles: imageFiles.length,
        fileName: file.name,
      });

      const blob = await convertImageFileToGrayscale(file);
      outputs.push({
        fileName: imageGrayscaleOutputName(file),
        blob,
      });
    }

    if (!outputs.length) {
      throw new Error("No grayscale images were created. Try different files.");
    }

    return outputs;
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

export async function imageGrayscaleZip(outputs: ImageGrayscaleOutput[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const output of outputs) {
    zip.file(output.fileName, output.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function imageGrayscaleDownloadName(outputs: ImageGrayscaleOutput[]): string {
  if (outputs.length === 1) return outputs[0].fileName;
  return `joinmypdf-grayscale-${outputs.length}-files.zip`;
}
