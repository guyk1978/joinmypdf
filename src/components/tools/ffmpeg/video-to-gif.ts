import {
  formatVideoFfmpegError,
  runVideoFfmpeg,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";

export function buildVideoToGifArgs(inputName: string, outputName: string): string[] {
  return [
    "-i",
    inputName,
    "-vf",
    "fps=10,scale=480:-1:flags=lanczos",
    "-c:v",
    "gif",
    outputName,
  ];
}

export async function convertVideoToGif(
  file: File,
  options: VideoFfmpegOptions = {},
): Promise<Blob> {
  return runVideoFfmpeg(
    file,
    (inputName, outputName) => buildVideoToGifArgs(inputName, outputName),
    "output.gif",
    "image/gif",
    options,
  );
}

export function videoToGifOutputName(fileName: string): string {
  return `${videoOutputBaseName(fileName)}.gif`;
}

export function formatVideoToGifError(error: unknown): string {
  const raw = formatVideoFfmpegError(error);
  const lower = raw.toLowerCase();

  if (lower.includes("palette") || lower.includes("gif")) {
    return "GIF conversion failed. Try a shorter clip (under ~30 seconds) for best results in the browser.";
  }

  return raw;
}
