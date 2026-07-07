import {
  formatVideoFfmpegError,
  runVideoFfmpeg,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";

export type VideoRotationAngle = 90 | 180 | 270;

export const VIDEO_ROTATION_ANGLES: VideoRotationAngle[] = [90, 180, 270];

export function buildRotateVideoFilter(angle: VideoRotationAngle): string {
  if (angle === 90) return "transpose=1";
  if (angle === 180) return "transpose=2,transpose=2";
  return "transpose=2";
}

export function buildRotateVideoArgs(
  inputName: string,
  outputName: string,
  angle: VideoRotationAngle,
): string[] {
  return ["-i", inputName, "-vf", buildRotateVideoFilter(angle), outputName];
}

export async function rotateVideo(
  file: File,
  angle: VideoRotationAngle,
  options: VideoFfmpegOptions = {},
): Promise<Blob> {
  return runVideoFfmpeg(
    file,
    (inputName, outputName) => buildRotateVideoArgs(inputName, outputName, angle),
    "output.mp4",
    "video/mp4",
    options,
  );
}

export function rotateVideoOutputName(fileName: string, angle: VideoRotationAngle): string {
  return `${videoOutputBaseName(fileName)}-rotated-${angle}.mp4`;
}

export function formatRotateVideoError(error: unknown): string {
  return formatVideoFfmpegError(error);
}
