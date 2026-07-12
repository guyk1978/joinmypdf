import { downloadVideoBlob, isAcceptedVideoFile, VIDEO_TO_MP4_ACCEPT } from "@/lib/video-to-mp4";
import {
  clampVideoCompressCrf,
  VIDEO_COMPRESS_CRF_BY_LEVEL,
  VIDEO_COMPRESS_CRF_DEFAULT,
  type VideoCompressionLevel,
} from "@/services/media";

export { isAcceptedVideoFile, VIDEO_TO_MP4_ACCEPT, downloadVideoBlob };
export {
  VIDEO_COMPRESS_CRF_MIN,
  VIDEO_COMPRESS_CRF_MAX,
  VIDEO_COMPRESS_CRF_DEFAULT,
  VIDEO_COMPRESS_CRF_BY_LEVEL,
  clampVideoCompressCrf,
} from "@/services/media";

export const DEFAULT_VIDEO_COMPRESSION_LEVEL: VideoCompressionLevel = 1;
export const DEFAULT_VIDEO_COMPRESS_CRF = VIDEO_COMPRESS_CRF_DEFAULT;

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

export function crfFromCompressionLevel(level: VideoCompressionLevel): number {
  return VIDEO_COMPRESS_CRF_BY_LEVEL[level];
}

/**
 * Rough size estimate for libx264 re-encode.
 * Rule of thumb: ~half the bits every +6 CRF from a CRF-18 baseline.
 */
export function estimateCompressedBytes(originalBytes: number, crf: number): number {
  const safeCrf = clampVideoCompressCrf(crf);
  const factor = Math.pow(0.5, (safeCrf - 18) / 6) * 0.92;
  return Math.max(1, Math.round(originalBytes * Math.min(0.98, Math.max(0.12, factor))));
}

/** Average bitrate in kbps from byte size and duration. */
export function averageBitrateKbps(bytes: number, durationSeconds: number): number | null {
  if (!bytes || !durationSeconds || durationSeconds <= 0) return null;
  return Math.round((bytes * 8) / durationSeconds / 1000);
}

export function formatBitrateKbps(kbps: number | null): string {
  if (kbps === null) return "—";
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(2)} Mbps`;
  return `${kbps} kbps`;
}
