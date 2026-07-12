import { buildAtempoFilterChain } from "@/components/tools/ffmpeg/change-mp3-speed";
import {
  formatVideoFfmpegError,
  inputNameForVideo,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";
import { fetchFile } from "@ffmpeg/util";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

/** Presets for the dedicated Video Speed tool (includes 4× via chained atempo). */
export const VIDEO_SPEED_PRESETS = [0.5, 0.75, 1.5, 2, 4] as const;
export type VideoSpeedPreset = (typeof VIDEO_SPEED_PRESETS)[number];

export const VIDEO_SPEED_MIN = 0.5;
export const VIDEO_SPEED_MAX = 4;

/** Legacy slider bounds used by VideoSpeedController (0.5×–2.0×). */
export const MIN_SPEED = 0.5;
export const MAX_SPEED = 2;

export function isMp4File(file: File): boolean {
  if (file.type === "video/mp4" || file.type === "video/x-m4v") return true;
  return /\.(mp4|m4v)$/i.test(file.name);
}

export function validateVideoSpeedFactor(speed: number): number {
  if (!Number.isFinite(speed)) {
    throw new Error("Invalid speed value. Choose a factor between 0.5× and 4×.");
  }
  if (speed < VIDEO_SPEED_MIN || speed > VIDEO_SPEED_MAX) {
    throw new Error(
      `Speed must stay between ${VIDEO_SPEED_MIN}× and ${VIDEO_SPEED_MAX}×. Values above 2× chain atempo filters.`,
    );
  }
  return speed;
}

/**
 * Matches:
 * `ffmpeg -i input.mp4 -filter_complex "[0:v]setpts=1/N*PTS[v];[0:a]atempo=N[a]" -map "[v]" -map "[a]" output.mp4`
 *
 * Requires re-encoding (not stream copy)—expect longer processing than mute/trim.
 */
export function buildChangeVideoSpeedArgs(
  inputName: string,
  outputName: string,
  speed: number,
): string[] {
  const factor = validateVideoSpeedFactor(speed);
  const ptsFactor = (1 / factor).toFixed(4);
  const atempo = buildAtempoFilterChain(factor);
  return [
    "-i",
    inputName,
    "-filter_complex",
    `[0:v]setpts=${ptsFactor}*PTS[v];[0:a]${atempo}[a]`,
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-movflags",
    "+faststart",
    outputName,
  ];
}

export function buildChangeVideoSpeedVideoOnlyArgs(
  inputName: string,
  outputName: string,
  speed: number,
): string[] {
  const factor = validateVideoSpeedFactor(speed);
  const ptsFactor = (1 / factor).toFixed(4);
  return [
    "-i",
    inputName,
    "-filter:v",
    `setpts=${ptsFactor}*PTS`,
    "-an",
    "-movflags",
    "+faststart",
    outputName,
  ];
}

async function execVideoSpeed(
  file: File,
  speed: number,
  options: VideoFfmpegOptions,
): Promise<Blob> {
  validateVideoSpeedFactor(speed);
  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;
  const inputName = inputNameForVideo(file);
  const outputName = "output.mp4";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      try {
        await ffmpeg.exec(buildChangeVideoSpeedArgs(inputName, outputName, speed));
      } catch {
        await ffmpeg.exec(buildChangeVideoSpeedVideoOnlyArgs(inputName, outputName, speed));
      }

      const outputBytes = await ffmpeg.readFile(outputName);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return new Blob([copy], { type: "video/mp4" });
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export async function changeVideoSpeed(
  file: File,
  speed: number,
  options: VideoFfmpegOptions = {},
): Promise<Blob> {
  return execVideoSpeed(file, speed, options);
}

export function changeVideoSpeedOutputName(fileName: string, speed: number): string {
  const label = Number.isInteger(speed) ? `${speed}` : String(speed).replace(".", "_");
  return `${videoOutputBaseName(fileName)}-${label}x.mp4`;
}

export function formatChangeVideoSpeedError(error: unknown): string {
  return formatVideoFfmpegError(error);
}

export function formatSpeedLabel(speed: number): string {
  if (Number.isInteger(speed)) return `${speed}×`;
  return `${speed}×`;
}
