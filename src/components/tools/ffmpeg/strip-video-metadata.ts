import {
  formatVideoFfmpegError,
  runVideoFfmpeg,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";

export function isVideoMetadataCleanerInput(file: File): boolean {
  if (
    file.type === "video/mp4" ||
    file.type === "video/quicktime" ||
    file.type === "video/x-m4v"
  ) {
    return true;
  }
  return /\.(mp4|m4v|mov)$/i.test(file.name);
}

/**
 * Strip container metadata via stream copy — matches:
 * `ffmpeg -i input.mp4 -map_metadata -1 -c copy output.mp4`
 *
 * Also drops chapters. Near-instant; no re-encode.
 */
export function buildStripVideoMetadataArgs(inputName: string, outputName: string): string[] {
  return [
    "-i",
    inputName,
    "-map_metadata",
    "-1",
    "-map_chapters",
    "-1",
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    outputName,
  ];
}

function outputNameFor(file: File): string {
  const isMov = file.type === "video/quicktime" || /\.mov$/i.test(file.name);
  return isMov ? "output.mov" : "output.mp4";
}

function mimeFor(file: File): string {
  if (file.type === "video/quicktime" || /\.mov$/i.test(file.name)) return "video/quicktime";
  return "video/mp4";
}

export async function stripVideoMetadata(
  file: File,
  callbacks: VideoFfmpegOptions = {},
): Promise<Blob> {
  if (!isVideoMetadataCleanerInput(file)) {
    throw new Error("Please upload an MP4 or MOV file.");
  }

  return runVideoFfmpeg(
    file,
    (inputName, outputName) => buildStripVideoMetadataArgs(inputName, outputName),
    outputNameFor(file),
    mimeFor(file),
    callbacks,
  );
}

export function stripVideoMetadataOutputName(fileName: string): string {
  const ext = /\.(mov)$/i.test(fileName) ? "mov" : "mp4";
  return `${videoOutputBaseName(fileName)}-cleaned.${ext}`;
}

export function formatStripVideoMetadataError(error: unknown): string {
  return formatVideoFfmpegError(error);
}
