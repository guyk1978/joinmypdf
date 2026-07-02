import { classifyPdfError, PdfProcessingError } from "./pdf-errors";
import { heicFileToJpegBlobs, isHeicFile } from "./heic-to-pdf";

export { isHeicFile };

export type HeicToJpgProgress = {
  phase: "converting" | "packaging";
  currentFile: number;
  totalFiles: number;
  fileName?: string;
};

export type HeicToJpgOutput = {
  fileName: string;
  blob: Blob;
};

export function heicToJpgOutputName(file: File, partIndex = 0, partTotal = 1): string {
  const base = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "photo";
  if (partTotal > 1) return `${slug}-${partIndex + 1}.jpg`;
  return `${slug}.jpg`;
}

/** Convert HEIC/HEIF images to JPG blobs locally in the browser. */
export async function heicToJpg(
  files: File[],
  onProgress?: (progress: HeicToJpgProgress) => void,
): Promise<HeicToJpgOutput[]> {
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

  const outputs: HeicToJpgOutput[] = [];

  try {
    for (let i = 0; i < heicFiles.length; i++) {
      const file = heicFiles[i];
      onProgress?.({
        phase: "converting",
        currentFile: i + 1,
        totalFiles: heicFiles.length,
        fileName: file.name,
      });

      const jpegBlobs = await heicFileToJpegBlobs(file);
      jpegBlobs.forEach((blob, index) => {
        outputs.push({
          fileName: heicToJpgOutputName(file, index, jpegBlobs.length),
          blob,
        });
      });
    }

    if (!outputs.length) {
      throw new Error("No JPG images were created. Try different HEIC files.");
    }

    return outputs;
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

export async function heicToJpgZip(outputs: HeicToJpgOutput[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const output of outputs) {
    zip.file(output.fileName, output.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function heicToJpgDownloadName(outputs: HeicToJpgOutput[]): string {
  if (outputs.length === 1) return outputs[0].fileName;
  return `joinmypdf-heic-jpg-${outputs.length}-files.zip`;
}
