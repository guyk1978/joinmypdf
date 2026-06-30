import { createImage, loadImageFileForCrop } from "@/lib/crop-image";
import { canvasToPngBlob, encodeIcoBlob, downloadBlob, FAVICON_EXPORT_SIZES } from "@/lib/generate-favicon";
import { drawImageToSquareCanvas } from "@/lib/png-to-ico";

export { downloadBlob };

export type FaviconPackFileEntry = {
  size: number;
  filename: string;
  labelKey: string;
};

export const FAVICON_PACK_PNG_ENTRIES: FaviconPackFileEntry[] = [
  { size: 16, filename: "favicon-16x16.png", labelKey: "size16" },
  { size: 32, filename: "favicon-32x32.png", labelKey: "size32" },
  { size: 48, filename: "favicon-48x48.png", labelKey: "size48" },
  { size: 180, filename: "apple-touch-icon.png", labelKey: "size180" },
  { size: 192, filename: "android-chrome-192x192.png", labelKey: "size192" },
  { size: 256, filename: "icon-256x256.png", labelKey: "size256" },
  { size: 512, filename: "android-chrome-512x512.png", labelKey: "size512" },
];

export function isAcceptedFaviconPackFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/png" || type === "image/jpeg" || type === "image/jpg") return true;
  return /\.(png|jpe?g)$/i.test(file.name);
}

export function faviconPackOutputName(sourceName: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "favicon";
  return `${base}-pack.zip`;
}

export async function loadFaviconPackPreview(file: File): Promise<string> {
  if (!isAcceptedFaviconPackFile(file)) {
    throw new Error("Invalid image file.");
  }
  return loadImageFileForCrop(file);
}

export type FaviconPackProgress = {
  percent: number;
  stage: "rendering" | "zipping" | "done";
  currentFile?: string;
};

export async function buildFaviconPackZip(
  imageSrc: string,
  onProgress?: (progress: FaviconPackProgress) => void,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const totalSteps = FAVICON_PACK_PNG_ENTRIES.length + 1;
  let completed = 0;

  const report = (stage: FaviconPackProgress["stage"], currentFile?: string) => {
    const percent = Math.min(100, Math.round((completed / totalSteps) * 100));
    onProgress?.({ percent, stage, currentFile });
  };

  report("rendering", "favicon.ico");
  const icoFrames = FAVICON_EXPORT_SIZES.map((size) => ({
    size,
    canvas: drawImageToSquareCanvas(image, size),
  }));
  const icoBlob = await encodeIcoBlob(icoFrames);
  zip.file("favicon.ico", await icoBlob.arrayBuffer());
  completed += 1;
  report("rendering");

  for (const entry of FAVICON_PACK_PNG_ENTRIES) {
    report("rendering", entry.filename);
    const canvas = drawImageToSquareCanvas(image, entry.size);
    const pngBlob = await canvasToPngBlob(canvas);
    zip.file(entry.filename, await pngBlob.arrayBuffer());
    completed += 1;
    report("rendering", entry.filename);
  }

  report("zipping");
  const zipBlob = await zip.generateAsync(
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
    (metadata) => {
      const zipPercent = Math.round(metadata.percent);
      onProgress?.({
        percent: Math.min(99, 70 + Math.round(zipPercent * 0.29)),
        stage: "zipping",
      });
    },
  );

  onProgress?.({ percent: 100, stage: "done" });
  return zipBlob;
}
