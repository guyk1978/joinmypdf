import { loadImageFileForCrop } from "@/lib/crop-image";
import { isAcceptedFaviconPackFile } from "@/lib/favicon-pack";
import { isAcceptedIcoFile, parseIcoFile, revokeIcoFrames } from "@/lib/ico-to-png";
import { isAcceptedSvgFile, loadSvgPreviewUrl } from "@/lib/svg-to-favicon";

export const DEFAULT_FAVICON_PREVIEW_TITLE = "My Website";

export type FaviconPreviewUiTheme = "light" | "dark";

export function isAcceptedFaviconPreviewFile(file: File): boolean {
  return isAcceptedFaviconPackFile(file) || isAcceptedIcoFile(file) || isAcceptedSvgFile(file);
}

export function normalizeFaviconPreviewUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^data:/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed;
}

export function isLikelyFaviconPreviewUrl(value: string): boolean {
  const normalized = normalizeFaviconPreviewUrl(value);
  if (!normalized) return false;
  if (/^data:image\//i.test(normalized)) return true;
  try {
    const url = new URL(normalized, typeof window !== "undefined" ? window.location.origin : "https://example.com");
    return Boolean(url.pathname);
  } catch {
    return normalized.startsWith("/");
  }
}

export async function resolveFaviconPreviewFromFile(file: File): Promise<string> {
  if (!isAcceptedFaviconPreviewFile(file)) {
    throw new Error("Invalid favicon file.");
  }

  if (isAcceptedIcoFile(file)) {
    const frames = await parseIcoFile(file);
    const largest = frames[0];
    if (!largest) {
      revokeIcoFrames(frames);
      throw new Error("No icons found in this ICO file.");
    }

    const previewUrl = URL.createObjectURL(largest.pngBlob);
    revokeIcoFrames(frames);
    return previewUrl;
  }

  if (isAcceptedSvgFile(file)) {
    return loadSvgPreviewUrl(file);
  }

  return loadImageFileForCrop(file);
}
