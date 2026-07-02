import { classifyPdfError, PdfProcessingError } from "./pdf-errors";
import { formatBytes } from "./pdf-to-word";

export { formatBytes };

export type HeicToPdfProgress = {
  phase: "converting" | "building";
  currentFile: number;
  totalFiles: number;
  fileName?: string;
  currentPage?: number;
  totalPages?: number;
};

const HEIC_ACCEPT_RE = /\.(heic|heif)$/i;
const HEIC_MIME_RE = /^image\/(heic|heif)/i;

export function isHeicFile(file: File): boolean {
  return HEIC_ACCEPT_RE.test(file.name) || HEIC_MIME_RE.test(file.type);
}

function heicErrorMessage(fileName: string, cause?: unknown): string {
  const detail =
    cause instanceof Error && cause.message ? ` ${cause.message}` : "";
  return `"${fileName}" could not be converted. It may be corrupted, password-protected, or not a valid HEIC/HEIF image.${detail}`;
}

export async function heicFileToJpegBlobs(file: File): Promise<Blob[]> {
  const heic2any = (await import("heic2any")).default;
  try {
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
    const blobs = (Array.isArray(result) ? result : [result]).filter(
      (entry): entry is Blob => entry instanceof Blob,
    );
    if (!blobs.length) {
      throw new PdfProcessingError("corrupt", heicErrorMessage(file.name));
    }
    return blobs;
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw new PdfProcessingError("corrupt", heicErrorMessage(file.name, error), error);
  }
}

async function jpegBlobToImageData(
  blob: Blob,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error("The converted image could not be loaded for PDF export."));
      img.src = url;
    });

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) {
      throw new Error("The converted image has invalid dimensions.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not prepare the image for PDF export.");
    }
    ctx.drawImage(image, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.92), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function pageOrientation(width: number, height: number): "portrait" | "landscape" {
  return width >= height ? "landscape" : "portrait";
}

/** Convert one or more HEIC/HEIF images into a single PDF (one page per image). */
export async function heicToPdf(
  files: File[],
  onProgress?: (progress: HeicToPdfProgress) => void,
): Promise<Blob> {
  const valid = (files || []).filter(Boolean);
  if (!valid.length) {
    throw new Error("Add at least one HEIC image.");
  }

  const heicFiles = valid.filter(isHeicFile);
  if (heicFiles.length !== valid.length) {
    const rejected = valid.find((file) => !isHeicFile(file));
    throw new Error(
      `"${rejected?.name ?? "File"}" is not a HEIC/HEIF image. Choose .heic or .heif files only.`,
    );
  }

  for (const file of heicFiles) {
    if (file.size === 0) {
      throw new Error(`"${file.name}" is empty. Choose another HEIC file.`);
    }
  }

  onProgress?.({
    phase: "converting",
    currentFile: 0,
    totalFiles: heicFiles.length,
  });

  try {
    const { jsPDF } = await import("jspdf");
    let pdf: InstanceType<typeof jsPDF> | null = null;
    let pageIndex = 0;
    let totalPages = 0;

    for (let i = 0; i < heicFiles.length; i++) {
      const file = heicFiles[i];
      const fileIndex = i + 1;
      onProgress?.({
        phase: "converting",
        currentFile: fileIndex,
        totalFiles: heicFiles.length,
        fileName: file.name,
      });

      const jpegBlobs = await heicFileToJpegBlobs(file);
      totalPages += jpegBlobs.length;

      for (const jpegBlob of jpegBlobs) {
        pageIndex += 1;
        onProgress?.({
          phase: "building",
          currentFile: fileIndex,
          totalFiles: heicFiles.length,
          fileName: file.name,
          currentPage: pageIndex,
          totalPages,
        });

        const { dataUrl, width, height } = await jpegBlobToImageData(jpegBlob);
        const orientation = pageOrientation(width, height);

        if (!pdf) {
          pdf = new jsPDF({
            unit: "pt",
            format: [width, height],
            orientation,
          });
          pdf.addImage(dataUrl, "JPEG", 0, 0, width, height);
          continue;
        }

        pdf.addPage([width, height], orientation);
        pdf.addImage(dataUrl, "JPEG", 0, 0, width, height);
      }
    }

    if (!pdf || pageIndex === 0) {
      throw new Error("No pages were added to the PDF. Try different HEIC files.");
    }

    return pdf.output("blob");
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

export function heicToPdfOutputName(files: File[]): string {
  if (!files.length) return "joinmypdf-heic.pdf";
  if (files.length === 1) {
    const base =
      files[0].name.replace(/\.(heic|heif)$/i, "") || "photo";
    const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "photo";
    return `joinmypdf-${slug}.pdf`;
  }
  const base = files[0].name.replace(/\.(heic|heif)$/i, "") || "album";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "album";
  return `joinmypdf-${slug}-and-${files.length - 1}-more.pdf`;
}
