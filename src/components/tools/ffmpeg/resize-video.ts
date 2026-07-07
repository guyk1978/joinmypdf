import {
  formatVideoFfmpegError,
  runVideoFfmpeg,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";

export type VideoResolution = 480 | 720 | 1080;

export const VIDEO_RESOLUTIONS: VideoResolution[] = [480, 720, 1080];

export function buildResizeVideoArgs(
  inputName: string,
  outputName: string,
  height: VideoResolution,
): string[] {
  return ["-i", inputName, "-vf", `scale=-1:${height}`, "-c:a", "copy", outputName];
}

export async function resizeVideo(
  file: File,
  height: VideoResolution,
  options: VideoFfmpegOptions = {},
): Promise<Blob> {
  return runVideoFfmpeg(
    file,
    (inputName, outputName) => buildResizeVideoArgs(inputName, outputName, height),
    "output.mp4",
    "video/mp4",
    options,
  );
}

export function resizeVideoOutputName(fileName: string, height: VideoResolution): string {
  return `${videoOutputBaseName(fileName)}-${height}p.mp4`;
}

export function formatResizeVideoError(error: unknown): string {
  return formatVideoFfmpegError(error);
}
