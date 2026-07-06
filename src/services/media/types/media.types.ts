export type MediaKind = "audio" | "video";

export type MediaProcessingPhase = "idle" | "loading" | "processing" | "success" | "error";

export type MediaProgress = {
  phase: MediaProcessingPhase;
  /** Normalized progress ratio between 0 and 1. */
  ratio: number;
  message?: string;
};

export class MediaProcessingError extends Error {
  readonly code: string;
  readonly cause?: unknown;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = "MediaProcessingError";
    this.code = code;
    this.cause = cause;
  }
}

export type MediaMetadata = {
  durationSeconds: number;
  format: string;
  width?: number;
  height?: number;
  bitrate?: number;
};

export type VideoTrimOptions = {
  startSeconds: number;
  endSeconds: number;
  outputFormat?: string;
};

export type VideoConvertOptions = {
  outputFormat: string;
};

export type VideoToMp4Options = {
  /** When true and the source is MP4/M4V, remux with stream copy before re-encoding. */
  preferCopy?: boolean;
  crf?: number;
};

/** 0 = low compression (high quality), 2 = high compression (smaller file). */
export type VideoCompressionLevel = 0 | 1 | 2;

export type VideoCompressOptions = {
  crf?: number;
  compressionLevel?: VideoCompressionLevel;
};

export const VIDEO_TO_MP4_DEFAULT_CRF = 23;

export const VIDEO_COMPRESS_CRF_BY_LEVEL: Record<VideoCompressionLevel, number> = {
  0: 23,
  1: 25,
  2: 28,
};

export function resolveVideoCompressCrf(options: VideoCompressOptions): number {
  if (typeof options.crf === "number" && Number.isFinite(options.crf)) {
    return Math.min(28, Math.max(23, Math.round(options.crf)));
  }
  const level = options.compressionLevel ?? 1;
  return VIDEO_COMPRESS_CRF_BY_LEVEL[level];
}

export type AudioCompressOptions = {
  bitrateKbps: number;
  outputFormat?: string;
};

export type AudioConvertOptions = {
  outputFormat: string;
};

export type AudioExtractOptions = {
  outputFormat?: string;
};

export type MediaOutputFormat = string;

export function extensionFromFile(file: File): string {
  const match = file.name.match(/\.([^.]+)$/i);
  return match?.[1]?.toLowerCase() ?? "bin";
}

export function mimeFromExtension(ext: string): string {
  const normalized = ext.replace(/^\./, "").toLowerCase();
  const map: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    ogg: "audio/ogg",
    aac: "audio/aac",
    flac: "audio/flac",
  };
  return map[normalized] ?? "application/octet-stream";
}

export function secondsToFfmpegTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const wholeSecs = Math.floor(secs);
  const millis = Math.round((secs - wholeSecs) * 1000);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(wholeSecs)}.${String(millis).padStart(3, "0")}`;
}
