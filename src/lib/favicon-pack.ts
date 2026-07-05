import { createImage, loadImageFileForCrop } from "@/lib/crop-image";
import { buildFaviconHtmlSnippet } from "@/lib/favicon-code-generator";
import { canvasToPngBlob, encodeIcoBlob, downloadBlob, FAVICON_EXPORT_SIZES } from "@/lib/generate-favicon";
import { drawImageToSquareCanvas, type DrawImageToSquareOptions } from "@/lib/png-to-ico";

export { downloadBlob };

/** Auto-fit: letterbox/pillarbox with transparent padding — no stretch or crop. */
export const FAVICON_PACK_DRAW_OPTIONS: DrawImageToSquareOptions = {
  letterboxPadding: true,
  letterboxFill: "transparent",
};

export const FAVICON_PACK_PREVIEW_SIZE = 256;

export const FAVICON_PACK_LARGEST_EXPORT = 512;

/** Recommend at least this many pixels on the shortest side for crisp 512×512 exports. */
export const FAVICON_PACK_RECOMMENDED_MIN_PX = 512;

/** Warn when the source must upscale by this factor (or more) at 512×512 export. */
export const FAVICON_PACK_UPSCALE_WARN_FACTOR = 2;

export type FaviconPackQualityAnalysis = {
  upscaleFactor: number;
  needsWarning: boolean;
  shortSide: number;
  recommendedMinPx: number;
};

export function analyzeFaviconPackSourceQuality(
  width: number,
  height: number,
): FaviconPackQualityAnalysis {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const upscaleFactor = Math.min(FAVICON_PACK_LARGEST_EXPORT / w, FAVICON_PACK_LARGEST_EXPORT / h);
  const shortSide = Math.min(w, h);
  const needsWarning = upscaleFactor >= FAVICON_PACK_UPSCALE_WARN_FACTOR;

  return {
    upscaleFactor,
    needsWarning,
    shortSide,
    recommendedMinPx: FAVICON_PACK_RECOMMENDED_MIN_PX,
  };
}

export function formatFaviconPackUpscaleFactor(factor: number): string {
  if (factor >= 10) return factor.toFixed(0);
  if (factor >= 2) return factor.toFixed(1);
  return factor.toFixed(2);
}

export function needsFaviconPackAutoFit(width: number, height: number): boolean {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  return Math.abs(w / h - 1) > 0.01;
}

export function drawFaviconPackIconCanvas(
  image: HTMLImageElement,
  size: number,
): HTMLCanvasElement {
  return drawImageToSquareCanvas(image, size, FAVICON_PACK_DRAW_OPTIONS);
}

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

export const FAVICON_PACK_DEFAULT_ICON_PATH = "/favicon.ico";

export const FAVICON_PACK_MANIFEST_FILENAME = "site.webmanifest";

export function buildFaviconPackHeaderSnippet(
  faviconPath: string = FAVICON_PACK_DEFAULT_ICON_PATH,
): string {
  return buildFaviconHtmlSnippet(faviconPath);
}

export function buildFaviconPackWebManifest(siteTitle: string): string {
  const name = siteTitle.trim() || "Your Site";
  const shortName = name.length > 12 ? name.slice(0, 12).trim() : name;

  return `${JSON.stringify(
    {
      name,
      short_name: shortName,
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
    },
    null,
    2,
  )}\n`;
}

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

export type BuildFaviconPackZipOptions = {
  siteTitle?: string;
  onProgress?: (progress: FaviconPackProgress) => void;
};

export async function buildFaviconPackZip(
  imageSrc: string,
  options: BuildFaviconPackZipOptions = {},
): Promise<Blob> {
  const { siteTitle = "Your Site", onProgress } = options;
  const image = await createImage(imageSrc);
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const totalSteps = FAVICON_PACK_PNG_ENTRIES.length + 2;
  let completed = 0;

  const report = (stage: FaviconPackProgress["stage"], currentFile?: string) => {
    const percent = Math.min(100, Math.round((completed / totalSteps) * 100));
    onProgress?.({ percent, stage, currentFile });
  };

  report("rendering", "favicon.ico");
  const icoFrames = FAVICON_EXPORT_SIZES.map((size) => ({
    size,
    canvas: drawFaviconPackIconCanvas(image, size),
  }));
  const icoBlob = await encodeIcoBlob(icoFrames);
  zip.file("favicon.ico", await icoBlob.arrayBuffer());
  completed += 1;
  report("rendering");

  for (const entry of FAVICON_PACK_PNG_ENTRIES) {
    report("rendering", entry.filename);
    const canvas = drawFaviconPackIconCanvas(image, entry.size);
    const pngBlob = await canvasToPngBlob(canvas);
    zip.file(entry.filename, await pngBlob.arrayBuffer());
    completed += 1;
    report("rendering", entry.filename);
  }

  report("rendering", FAVICON_PACK_MANIFEST_FILENAME);
  zip.file(FAVICON_PACK_MANIFEST_FILENAME, buildFaviconPackWebManifest(siteTitle));
  completed += 1;
  report("rendering");

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
