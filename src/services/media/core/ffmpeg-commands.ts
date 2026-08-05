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
  const args = [
    "-i",
    inputName,
    "-ss",
    secondsToFfmpegTimestamp(startSeconds),
    "-to",
    secondsToFfmpegTimestamp(endSeconds),
    "-c",
    "copy",
  ];
  if (/\.(mp4|m4v|mov)$/i.test(outputName)) {
    args.push("-movflags", "+faststart");
  }
  args.push(outputName);
  return args;
}

export function buildConvertArgs(inputName: string, outputName: string): string[] {
  const lower = outputName.toLowerCase();
  if (lower.endsWith(".mp3")) {
    return [
      "-i",
      inputName,
      "-vn",
      "-codec:a",
      "libmp3lame",
      "-q:a",
      "2",
      "-write_xing",
      "1",
      "-id3v2_version",
      "3",
      outputName,
    ];
  }
  if (lower.endsWith(".mp4") || lower.endsWith(".m4v") || lower.endsWith(".mov")) {
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
  if (lower.endsWith(".wav")) {
    return ["-i", inputName, "-codec:a", "pcm_s16le", outputName];
  }
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

export function buildAudioCompressArgs(
  inputName: string,
  outputName: string,
  bitrateKbps: number,
): string[] {
  const kbps = Math.max(8, Math.round(bitrateKbps));
  return [
    "-i",
    inputName,
    "-vn",
    "-codec:a",
    "libmp3lame",
    "-b:a",
    `${kbps}k`,
    "-write_xing",
    "1",
    "-id3v2_version",
    "3",
    outputName,
  ];
}

export function buildExtractAudioArgs(inputName: string, outputName: string): string[] {
  // Re-encode to AAC so extract always yields a playable m4a (stream-copy often mismatches).
  return [
    "-i",
    inputName,
    "-vn",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outputName,
  ];
}
