/**
 * Shared FFmpeg.wasm encode flag tails — keep audio/video tools consistent.
 */

/** Finalize MP3 with libmp3lame + Xing + ID3v2 so players accept the file. */
export function mp3LameCbrTail(bitrateKbps: number): string[] {
  const kbps = Math.max(8, Math.round(bitrateKbps));
  return [
    "-codec:a",
    "libmp3lame",
    "-b:a",
    `${kbps}k`,
    "-write_xing",
    "1",
    "-id3v2_version",
    "3",
  ];
}

/** High-quality VBR MP3 (q:a 0–9; lower = higher quality). */
export function mp3LameVbrTail(quality = 2): string[] {
  const q = Math.min(9, Math.max(0, Math.round(quality)));
  return [
    "-codec:a",
    "libmp3lame",
    "-q:a",
    String(q),
    "-write_xing",
    "1",
    "-id3v2_version",
    "3",
  ];
}

/** Web-compatible H.264 video + AAC audio + faststart. */
export function h264AacFaststartTail(options?: {
  crf?: number;
  preset?: string;
  audioBitrateKbps?: number;
  copyAudio?: boolean;
}): string[] {
  const crf = options?.crf ?? 23;
  const preset = options?.preset ?? "medium";
  const audioBitrate = options?.audioBitrateKbps ?? 128;
  const tail = [
    "-c:v",
    "libx264",
    "-crf",
    String(crf),
    "-preset",
    preset,
    "-pix_fmt",
    "yuv420p",
  ];
  if (options?.copyAudio) {
    tail.push("-c:a", "copy");
  } else {
    tail.push("-c:a", "aac", "-b:a", `${audioBitrate}k`);
  }
  tail.push("-movflags", "+faststart");
  return tail;
}

/** Video-only H.264 + faststart (no audio). */
export function h264FaststartVideoOnlyTail(options?: { crf?: number; preset?: string }): string[] {
  const crf = options?.crf ?? 23;
  const preset = options?.preset ?? "medium";
  return [
    "-c:v",
    "libx264",
    "-crf",
    String(crf),
    "-preset",
    preset,
    "-pix_fmt",
    "yuv420p",
    "-an",
    "-movflags",
    "+faststart",
  ];
}

export function pcmWavTail(): string[] {
  return ["-codec:a", "pcm_s16le"];
}

export function aacM4aTail(bitrateKbps = 192): string[] {
  const kbps = Math.max(32, Math.round(bitrateKbps));
  return ["-c:a", "aac", "-b:a", `${kbps}k`, "-movflags", "+faststart"];
}

/**
 * Prefer not to exceed the source bitrate when re-encoding process tools.
 * Falls back to `preferred` when source is unknown.
 */
export function capAudioBitrateKbps(
  preferredKbps: number,
  sourceKbps: number | null | undefined,
): number {
  const preferred = Math.max(8, Math.round(preferredKbps));
  if (!sourceKbps || sourceKbps <= 0) return preferred;
  return Math.max(8, Math.min(preferred, Math.round(sourceKbps)));
}
