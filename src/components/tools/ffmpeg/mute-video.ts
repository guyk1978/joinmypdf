import {
  formatVideoFfmpegError,
  runVideoFfmpeg,
  videoOutputBaseName,
  type VideoFfmpegOptions,
} from "@/components/tools/ffmpeg/video-ffmpeg-base";

export function isMp4File(file: File): boolean {
  if (file.type === "video/mp4" || file.type === "video/x-m4v") return true;
  return /\.(mp4|m4v)$/i.test(file.name);
}

/**
 * Mute via stream copy — matches:
 * `ffmpeg -i input.mp4 -an -c:v copy output.mp4`
 *
 * Drops audio without re-encoding video (near-instant even on large files).
 */
export function buildMuteVideoArgs(inputName: string, outputName: string): string[] {
  return ["-i", inputName, "-an", "-c:v", "copy", "-movflags", "+faststart", outputName];
}

export async function muteVideo(file: File, callbacks: VideoFfmpegOptions = {}): Promise<Blob> {
  if (!isMp4File(file)) {
    throw new Error("Please upload an MP4 file. Stream-copy muting requires MP4 input.");
  }

  return runVideoFfmpeg(
    file,
    (inputName, outputName) => buildMuteVideoArgs(inputName, outputName),
    "output.mp4",
    "video/mp4",
    callbacks,
  );
}

export function muteVideoOutputName(fileName: string): string {
  return `${videoOutputBaseName(fileName)}-muted.mp4`;
}

export function formatMuteVideoError(error: unknown): string {
  const raw = formatVideoFfmpegError(error);
  const lower = raw.toLowerCase();

  if (lower.includes("does not contain any stream") || lower.includes("no video")) {
    return "No video track was found in this file. Upload an MP4 that includes a video stream.";
  }

  return raw;
}
