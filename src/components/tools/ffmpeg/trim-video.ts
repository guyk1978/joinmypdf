import { secondsToFfmpegTimestamp } from "@/services/media/types";
import {
  formatVideoFfmpegError,
  runVideoFfmpeg,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";

export type TrimVideoOptions = {
  startSeconds: number;
  endSeconds: number;
};

export function isMp4File(file: File): boolean {
  if (file.type === "video/mp4" || file.type === "video/x-m4v") return true;
  return /\.(mp4|m4v)$/i.test(file.name);
}

/**
 * Stream-copy trim — matches:
 * `ffmpeg -i input.mp4 -ss [start] -to [end] -c copy output.mp4`
 */
export function buildTrimVideoArgs(
  inputName: string,
  outputName: string,
  startSeconds: number,
  endSeconds: number,
): string[] {
  return [
    "-i",
    inputName,
    "-ss",
    secondsToFfmpegTimestamp(startSeconds),
    "-to",
    secondsToFfmpegTimestamp(endSeconds),
    "-c",
    "copy",
    outputName,
  ];
}

export async function trimVideo(
  file: File,
  options: TrimVideoOptions,
  callbacks: VideoFfmpegOptions = {},
): Promise<Blob> {
  if (!isMp4File(file)) {
    throw new Error("Please upload an MP4 file. Stream-copy trimming requires MP4 input.");
  }

  if (!(options.startSeconds < options.endSeconds)) {
    throw new Error("Start time must be earlier than end time.");
  }

  return runVideoFfmpeg(
    file,
    (inputName, outputName) =>
      buildTrimVideoArgs(inputName, outputName, options.startSeconds, options.endSeconds),
    "output.mp4",
    "video/mp4",
    callbacks,
  );
}

export function trimVideoOutputName(fileName: string): string {
  return `${videoOutputBaseName(fileName)}-trimmed.mp4`;
}

export function formatTrimVideoError(error: unknown): string {
  return formatVideoFfmpegError(error);
}
