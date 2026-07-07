import {
  buildAtempoFilterChain,
  MAX_SPEED,
  MIN_SPEED,
  validateSpeedFactor,
} from "@/components/tools/ffmpeg/change-mp3-speed";
import {
  formatVideoFfmpegError,
  inputNameForVideo,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";
import { fetchFile } from "@ffmpeg/util";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export { MIN_SPEED, MAX_SPEED };

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function buildChangeVideoSpeedArgs(
  inputName: string,
  outputName: string,
  speed: number,
): string[] {
  const ptsFactor = (1 / speed).toFixed(4);
  const atempo = buildAtempoFilterChain(speed);
  return [
    "-i",
    inputName,
    "-filter_complex",
    `[0:v]setpts=${ptsFactor}*PTS[v];[0:a]${atempo}[a]`,
    "-map",
    "[v]",
    "-map",
    "[a]",
    outputName,
  ];
}

export function buildChangeVideoSpeedVideoOnlyArgs(
  inputName: string,
  outputName: string,
  speed: number,
): string[] {
  const ptsFactor = (1 / speed).toFixed(4);
  return ["-i", inputName, "-filter:v", `setpts=${ptsFactor}*PTS`, "-an", outputName];
}

async function execVideoSpeed(
  file: File,
  speed: number,
  options: VideoFfmpegOptions,
): Promise<Blob> {
  validateSpeedFactor(speed);
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

export async function changeVideoSpeed(
  file: File,
  speed: number,
  options: VideoFfmpegOptions = {},
): Promise<Blob> {
  return execVideoSpeed(file, speed, options);
}

export function changeVideoSpeedOutputName(fileName: string, speed: number): string {
  const label = Number.isInteger(speed) ? `${speed}` : speed.toFixed(1);
  return `${videoOutputBaseName(fileName)}-${label}x.mp4`;
}

export function formatChangeVideoSpeedError(error: unknown): string {
  return formatVideoFfmpegError(error);
}
