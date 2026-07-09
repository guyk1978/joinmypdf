import { classifyPdfError, PdfProcessingError } from "./pdf-errors";
import {
  createImage,
  downloadBlob,
  isAcceptedImageFile,
  loadImageFileForCrop,
} from "./crop-image";

export { downloadBlob, isAcceptedImageFile };

export type FlipDirection = "horizontal" | "vertical";

export type FlipImageProgress = {
  phase: "converting" | "packaging";
  currentFile: number;
  totalFiles: number;
  fileName?: string;
};

export type FlipImageOutput = {
  fileName: string;
  blob: Blob;
};

const JPEG_QUALITY = 0.92;

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

export function flipImageOutputName(file: File, direction: FlipDirection): string {
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  const suffix = direction === "horizontal" ? "flipped-h" : "flipped-v";
  const { extension } = outputMimeForFile(file);
  return `${slug}-${suffix}.${extension}`;
}

export async function convertImageToFlipBlob(
  imageSrc: string,
  file: File,
  direction: FlipDirection,
): Promise<Blob> {
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

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (direction === "horizontal") {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, height);
    ctx.scale(1, -1);
  }

  ctx.drawImage(image, 0, 0, width, height);

  const { mime, quality } = outputMimeForFile(file);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export flipped image."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}

export async function convertImageFileToFlip(file: File, direction: FlipDirection): Promise<Blob> {
  const imageSrc = await loadImageFileForCrop(file);
  try {
    return await convertImageToFlipBlob(imageSrc, file, direction);
  } finally {
    URL.revokeObjectURL(imageSrc);
  }
}

/** Flip images horizontally or vertically locally in the browser. */
export async function flipImage(
  files: File[],
  direction: FlipDirection,
  onProgress?: (progress: FlipImageProgress) => void,
): Promise<FlipImageOutput[]> {
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

  const outputs: FlipImageOutput[] = [];

  try {
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      onProgress?.({
        phase: "converting",
        currentFile: i + 1,
        totalFiles: imageFiles.length,
        fileName: file.name,
      });

      const blob = await convertImageFileToFlip(file, direction);
      outputs.push({
        fileName: flipImageOutputName(file, direction),
        blob,
      });
    }

    if (!outputs.length) {
      throw new Error("No flipped images were created. Try different files.");
    }

    return outputs;
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

export async function flipImageZip(outputs: FlipImageOutput[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const output of outputs) {
    zip.file(output.fileName, output.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function flipImageDownloadName(outputs: FlipImageOutput[]): string {
  if (outputs.length === 1) return outputs[0].fileName;
  return `joinmypdf-flipped-${outputs.length}-files.zip`;
}
