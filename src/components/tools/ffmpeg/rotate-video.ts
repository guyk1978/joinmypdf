import {
  formatVideoFfmpegError,
  inputNameForVideo,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";
import { fetchFile } from "@ffmpeg/util";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type VideoRotationAngle = 90 | 180 | 270;

export const VIDEO_ROTATION_ANGLES: VideoRotationAngle[] = [90, 180, 270];

/** Fast stream-copy metadata flag vs pixel bake (re-encode). */
export type VideoRotateMethod = "metadata" | "reencode";

export function isMp4File(file: File): boolean {
  if (file.type === "video/mp4" || file.type === "video/x-m4v") return true;
  return /\.(mp4|m4v)$/i.test(file.name);
}

/**
 * Pixel rotation filters:
 * - transpose=1 → 90° clockwise
 * - transpose=2 → 90° counter-clockwise
 * - 180° → two 90° CCW passes
 */
export function buildRotateVideoFilter(angle: VideoRotationAngle): string {
  if (angle === 90) return "transpose=1";
  if (angle === 180) return "transpose=2,transpose=2";
  return "transpose=2";
}

/** CSS degrees for live preview (clockwise positive). */
export function cssRotateDegrees(angle: VideoRotationAngle): number {
  return angle;
}

/**
 * Container rotate metadata (degrees clockwise). Some players ignore this;
 * baking pixels with transpose is the universal fix.
 */
export function metadataRotateValue(angle: VideoRotationAngle): string {
  return String(angle);
}

export function buildRotateVideoReencodeArgs(
  inputName: string,
  outputName: string,
  angle: VideoRotationAngle,
): string[] {
  return [
    "-i",
    inputName,
    "-vf",
    buildRotateVideoFilter(angle),
    "-c:a",
    "copy",
    "-movflags",
    "+faststart",
    outputName,
  ];
}

/**
 * Near-instant stream copy — sets orientation metadata without re-encoding.
 * Works in ffmpeg.wasm when the build supports stream metadata writes.
 */
export function buildRotateVideoMetadataArgs(
  inputName: string,
  outputName: string,
  angle: VideoRotationAngle,
): string[] {
  return [
    "-i",
    inputName,
    "-c",
    "copy",
    "-metadata:s:v:0",
    `rotate=${metadataRotateValue(angle)}`,
    "-movflags",
    "+faststart",
    outputName,
  ];
}

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

async function execRotate(
  file: File,
  angle: VideoRotationAngle,
  method: VideoRotateMethod,
  options: VideoFfmpegOptions,
): Promise<{ blob: Blob; methodUsed: VideoRotateMethod }> {
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
      let methodUsed: VideoRotateMethod = method;

      if (method === "metadata") {
        try {
          await ffmpeg.exec(buildRotateVideoMetadataArgs(inputName, outputName, angle));
        } catch {
          // Metadata path unsupported or failed — bake pixels instead.
          methodUsed = "reencode";
          await ffmpeg.exec(buildRotateVideoReencodeArgs(inputName, outputName, angle));
        }
      } else {
        await ffmpeg.exec(buildRotateVideoReencodeArgs(inputName, outputName, angle));
      }

      const outputBytes = await ffmpeg.readFile(outputName);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return { blob: new Blob([copy], { type: "video/mp4" }), methodUsed };
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

export type RotateVideoResult = {
  blob: Blob;
  methodUsed: VideoRotateMethod;
};

export type RotateVideoOptions = VideoFfmpegOptions & {
  method?: VideoRotateMethod;
};

export async function rotateVideo(
  file: File,
  angle: VideoRotationAngle,
  options: RotateVideoOptions = {},
): Promise<RotateVideoResult> {
  if (!isMp4File(file)) {
    throw new Error("Please upload an MP4 file.");
  }
  const method = options.method ?? "reencode";
  return execRotate(file, angle, method, options);
}

export function rotateVideoOutputName(fileName: string, angle: VideoRotationAngle): string {
  return `${videoOutputBaseName(fileName)}-rotated-${angle}.mp4`;
}

export function formatRotateVideoError(error: unknown): string {
  return formatVideoFfmpegError(error);
}

/** @deprecated Prefer buildRotateVideoReencodeArgs */
export function buildRotateVideoArgs(
  inputName: string,
  outputName: string,
  angle: VideoRotationAngle,
): string[] {
  return buildRotateVideoReencodeArgs(inputName, outputName, angle);
}
