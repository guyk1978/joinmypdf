import {
  formatVideoFfmpegError,
  runVideoFfmpeg,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";
import { isAcceptedVideoFile } from "@/lib/video-to-mp4";

export type VideoConvertTargetFormat = "mp4" | "webm" | "mov";

export const VIDEO_CONVERT_TARGET_FORMATS: readonly VideoConvertTargetFormat[] = [
  "mp4",
  "webm",
  "mov",
] as const;

export type ConvertVideoFormatOptions = VideoFfmpegOptions & {
  targetFormat: VideoConvertTargetFormat;
};

const MIME_BY_FORMAT: Record<VideoConvertTargetFormat, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export function isVideoConverterInput(file: File): boolean {
  return isAcceptedVideoFile(file);
}

export function videoConvertOutputName(
  inputName: string,
  targetFormat: VideoConvertTargetFormat,
): string {
  return `${videoOutputBaseName(inputName)}.${targetFormat}`;
}

export function mimeForVideoConvertFormat(format: VideoConvertTargetFormat): string {
  return MIME_BY_FORMAT[format];
}

/**
 * MP4 / MOV: libx264 + AAC for maximum compatibility.
 * WebM: VP9 + Opus (standard WebM codecs; H.264-in-WebM is nonstandard).
 */
export function buildConvertVideoFormatArgs(
  inputName: string,
  outputName: string,
  targetFormat: VideoConvertTargetFormat,
): string[] {
  if (targetFormat === "webm") {
    return [
      "-i",
      inputName,
      "-c:v",
      "libvpx-vp9",
      "-crf",
      "32",
      "-b:v",
      "0",
      "-c:a",
      "libopus",
      "-b:a",
      "128k",
      outputName,
    ];
  }

  // ffmpeg -i input.file -c:v libx264 -c:a aac output.mp4|mov
  return [
    "-i",
    inputName,
    "-c:v",
    "libx264",
    "-crf",
    "23",
    "-preset",
    "medium",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputName,
  ];
}

export function formatConvertVideoError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (
    lower.includes("unknown encoder") ||
    lower.includes("encoder not found") ||
    lower.includes("could not find codec")
  ) {
    return "This browser FFmpeg build cannot encode the selected format. Try MP4, or re-export the source with a common codec.";
  }

  return formatVideoFfmpegError(error);
}

/**
 * Local-first multi-format video conversion via ffmpeg.wasm.
 */
export async function convertVideoFormat(
  file: File,
  options: ConvertVideoFormatOptions,
): Promise<Blob> {
  if (!isVideoConverterInput(file)) {
    throw new Error(
      "Please upload a supported video file (MOV, MKV, AVI, WMV, MP4, WEBM, and similar).",
    );
  }

  const { targetFormat } = options;
  const outputName = `output.${targetFormat}`;

  return runVideoFfmpeg(
    file,
    (inputName, outName) => buildConvertVideoFormatArgs(inputName, outName, targetFormat),
    outputName,
    mimeForVideoConvertFormat(targetFormat),
    options,
  );
}
