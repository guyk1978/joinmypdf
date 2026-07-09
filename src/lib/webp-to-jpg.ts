import { classifyPdfError, PdfProcessingError } from "./pdf-errors";
import { createImage, downloadBlob, loadImageFileForCrop } from "./crop-image";

export { downloadBlob };

const MIME_JPEG = "image/jpeg";
const DEFAULT_QUALITY = 0.92;

export type WebpToJpgProgress = {
  phase: "converting" | "packaging";
  currentFile: number;
  totalFiles: number;
  fileName?: string;
};

export type WebpToJpgOutput = {
  fileName: string;
  blob: Blob;
};

export function isWebpFile(file: File): boolean {
  return file.type === "image/webp" || /\.webp$/i.test(file.name);
}

export function webpToJpgOutputName(file: File): string {
  const base = file.name.replace(/\.webp$/i, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  return `${slug}.jpg`;
}

export async function convertWebpToJpgBlob(
  imageSrc: string,
  quality = DEFAULT_QUALITY,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas rendering is not supported in this browser.");
  }

  const width = Math.max(1, image.naturalWidth);
  const height = Math.max(1, image.naturalHeight);

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export JPG."));
          return;
        }
        resolve(blob);
      },
      MIME_JPEG,
      quality,
    );
  });
}

export async function convertWebpFileToJpg(file: File, quality = DEFAULT_QUALITY): Promise<Blob> {
  const imageSrc = await loadImageFileForCrop(file);
  try {
    return await convertWebpToJpgBlob(imageSrc, quality);
  } finally {
    URL.revokeObjectURL(imageSrc);
  }
}

/** Convert WebP images to JPG blobs locally in the browser. */
export async function webpToJpg(
  files: File[],
  onProgress?: (progress: WebpToJpgProgress) => void,
): Promise<WebpToJpgOutput[]> {
  const valid = (files || []).filter(Boolean);
  if (!valid.length) {
    throw new Error("Add at least one WebP image.");
  }

  const webpFiles = valid.filter(isWebpFile);
  if (webpFiles.length !== valid.length) {
    const rejected = valid.find((file) => !isWebpFile(file));
    throw new Error(
      `"${rejected?.name ?? "File"}" is not a WebP image. Choose .webp files only.`,
    );
  }

  for (const file of webpFiles) {
    if (file.size === 0) {
      throw new Error(`"${file.name}" is empty. Choose another WebP file.`);
    }
  }

  const outputs: WebpToJpgOutput[] = [];

  try {
    for (let i = 0; i < webpFiles.length; i++) {
      const file = webpFiles[i];
      onProgress?.({
        phase: "converting",
        currentFile: i + 1,
        totalFiles: webpFiles.length,
        fileName: file.name,
      });

      const blob = await convertWebpFileToJpg(file);
      outputs.push({
        fileName: webpToJpgOutputName(file),
        blob,
      });
    }

    if (!outputs.length) {
      throw new Error("No JPG images were created. Try different WebP files.");
    }

    return outputs;
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

export async function webpToJpgZip(outputs: WebpToJpgOutput[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const output of outputs) {
    zip.file(output.fileName, output.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function webpToJpgDownloadName(outputs: WebpToJpgOutput[]): string {
  if (outputs.length === 1) return outputs[0].fileName;
  return `joinmypdf-webp-jpg-${outputs.length}-files.zip`;
}
