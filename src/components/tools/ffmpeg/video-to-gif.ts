import { fetchFile } from "@ffmpeg/util";
import { secondsToFfmpegTimestamp } from "@/services/media/types";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";
import {
  formatVideoFfmpegError,
  inputNameForVideo,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";

export const VIDEO_TO_GIF_FPS_OPTIONS = [5, 8, 10, 12, 15] as const;
export const VIDEO_TO_GIF_SCALE_OPTIONS = [240, 320, 480, 640] as const;

export type VideoToGifFps = (typeof VIDEO_TO_GIF_FPS_OPTIONS)[number];
export type VideoToGifScale = (typeof VIDEO_TO_GIF_SCALE_OPTIONS)[number];

export type VideoToGifOptions = {
  startSeconds: number;
  durationSeconds: number;
  fps: VideoToGifFps;
  scaleWidth: VideoToGifScale;
};

const PALETTE_NAME = "palette.png";
const OUTPUT_NAME = "output.gif";

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

function buildFilters(fps: number, scaleWidth: number): string {
  return `fps=${fps},scale=${scaleWidth}:-1:flags=lanczos`;
}

/**
 * Pass 1 — build an optimized 256-color palette for the clip window.
 * `ffmpeg … -vf "fps=…,scale=…:flags=lanczos,palettegen" palette.png`
 */
export function buildPaletteGenArgs(
  inputName: string,
  paletteName: string,
  options: VideoToGifOptions,
): string[] {
  const filters = `${buildFilters(options.fps, options.scaleWidth)},palettegen=stats_mode=diff`;
  return [
    "-ss",
    secondsToFfmpegTimestamp(options.startSeconds),
    "-t",
    secondsToFfmpegTimestamp(options.durationSeconds),
    "-i",
    inputName,
    "-vf",
    filters,
    "-y",
    paletteName,
  ];
}

/**
 * Pass 2 — encode GIF with paletteuse for dithered, high-quality colors.
 * Matches the spirit of:
 * `ffmpeg -i input.mp4 -vf "fps=10,scale=320:-1:flags=lanczos" output.gif`
 * with palettization for the limited GIF color table.
 */
export function buildPaletteUseArgs(
  inputName: string,
  paletteName: string,
  outputName: string,
  options: VideoToGifOptions,
): string[] {
  const filters = buildFilters(options.fps, options.scaleWidth);
  return [
    "-ss",
    secondsToFfmpegTimestamp(options.startSeconds),
    "-t",
    secondsToFfmpegTimestamp(options.durationSeconds),
    "-i",
    inputName,
    "-i",
    paletteName,
    "-lavfi",
    `${filters}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
    "-y",
    outputName,
  ];
}

export function isValidVideoToGifOptions(options: VideoToGifOptions): boolean {
  return (
    options.startSeconds >= 0 &&
    options.durationSeconds > 0 &&
    VIDEO_TO_GIF_FPS_OPTIONS.includes(options.fps) &&
    VIDEO_TO_GIF_SCALE_OPTIONS.includes(options.scaleWidth)
  );
}

/**
 * Two-pass GIF conversion via ffmpeg.wasm:
 * 1) palettegen  2) paletteuse — keeps quality high despite GIF’s 256-color limit.
 */
export async function convertVideoToGif(
  file: File,
  options: VideoToGifOptions,
  callbacks: VideoFfmpegOptions = {},
): Promise<Blob> {
  if (!isValidVideoToGifOptions(options)) {
    throw new Error("Invalid GIF settings. Check start time, duration, FPS, and scale.");
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = callbacks.onProgress ? ffmpeg.onProgress(callbacks.onProgress) : undefined;
  const inputName = inputNameForVideo(file);

  try {
    callbacks.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    callbacks.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(buildPaletteGenArgs(inputName, PALETTE_NAME, options));
      await ffmpeg.exec(buildPaletteUseArgs(inputName, PALETTE_NAME, OUTPUT_NAME, options));

      const outputBytes = await ffmpeg.readFile(OUTPUT_NAME);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return new Blob([copy], { type: "image/gif" });
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(PALETTE_NAME).catch(() => undefined);
      await ffmpeg.deleteFile(OUTPUT_NAME).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

export function videoToGifOutputName(fileName: string): string {
  return `${videoOutputBaseName(fileName)}.gif`;
}

export function formatVideoToGifError(error: unknown): string {
  const raw = formatVideoFfmpegError(error);
  const lower = raw.toLowerCase();

  if (lower.includes("palette") || lower.includes("gif") || lower.includes("memory")) {
    return "GIF conversion failed. Try a shorter duration, lower FPS, or smaller scale for best results in the browser.";
  }

  return raw;
}
