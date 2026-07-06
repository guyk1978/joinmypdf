import { extensionFromFile, secondsToFfmpegTimestamp } from "../types";

export function inputFileName(file: File): string {
  return `input.${extensionFromFile(file)}`;
}

export function outputFileName(file: File, outputFormat: string, prefix = "output"): string {
  const ext = outputFormat.replace(/^\./, "").toLowerCase();
  return `${prefix}.${ext}`;
}

export function buildTrimArgs(
  inputName: string,
  outputName: string,
  startSeconds: number,
  endSeconds: number,
): string[] {
  return [
    "-ss",
    secondsToFfmpegTimestamp(startSeconds),
    "-to",
    secondsToFfmpegTimestamp(endSeconds),
    "-i",
    inputName,
    "-c",
    "copy",
    outputName,
  ];
}

export function buildConvertArgs(inputName: string, outputName: string): string[] {
  return ["-i", inputName, outputName];
}

/** Fast remux when codecs are already MP4-compatible (H.264/AAC). */
export function buildVideoToMp4CopyArgs(inputName: string, outputName: string): string[] {
  return ["-i", inputName, "-c", "copy", "-movflags", "+faststart", outputName];
}

/** Standard web encode — libx264 + AAC. */
export function buildVideoToMp4EncodeArgs(
  inputName: string,
  outputName: string,
  crf = 23,
): string[] {
  return [
    "-i",
    inputName,
    "-c:v",
    "libx264",
    "-crf",
    String(crf),
    "-preset",
    "medium",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputName,
  ];
}

export function buildAudioCompressArgs(
  inputName: string,
  outputName: string,
  bitrateKbps: number,
): string[] {
  return ["-i", inputName, "-b:a", `${bitrateKbps}k`, outputName];
}

export function buildExtractAudioArgs(inputName: string, outputName: string): string[] {
  return ["-i", inputName, "-vn", "-c:a", "copy", outputName];
}
