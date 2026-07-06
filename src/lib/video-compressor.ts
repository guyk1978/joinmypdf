import { downloadVideoBlob, isAcceptedVideoFile, VIDEO_TO_MP4_ACCEPT } from "@/lib/video-to-mp4";
import type { VideoCompressionLevel } from "@/services/media";

export { isAcceptedVideoFile, VIDEO_TO_MP4_ACCEPT, downloadVideoBlob };

export const DEFAULT_VIDEO_COMPRESSION_LEVEL: VideoCompressionLevel = 1;

export function videoCompressorOutputName(file: File): string {
  const base = file.name.replace(/\.[^.]+$/i, "").trim() || "video";
  const safe = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "video";
  return `${safe}-compressed.mp4`;
}

export function compressionBytesSaved(originalBytes: number, compressedBytes: number): number {
  if (!originalBytes || compressedBytes >= originalBytes) return 0;
  return originalBytes - compressedBytes;
}

export function compressionSavingsPercent(originalBytes: number, compressedBytes: number): number {
  if (!originalBytes || compressedBytes >= originalBytes) return 0;
  return Math.round(((originalBytes - compressedBytes) / originalBytes) * 100);
}

export function clampVideoCompressionLevel(value: number): VideoCompressionLevel {
  if (value <= 0) return 0;
  if (value >= 2) return 2;
  return 1;
}
