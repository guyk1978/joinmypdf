import { fetchFile } from "@ffmpeg/util";
import {
  detectAudioTrimFormat,
  isSupportedAudioTrimFile,
  type AudioTrimFormat,
} from "@/components/tools/ffmpeg/trim-audio";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type ChangeAudioSpeedOptions = {
  speed: number;
  /** When true (default), tempo changes without chipmunk/pitch shift (atempo / time-stretch). */
  maintainPitch?: boolean;
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

/** @deprecated Prefer ChangeAudioSpeedOptions */
export type ChangeMp3SpeedOptions = ChangeAudioSpeedOptions;

export const MIN_SPEED = 0.5;
export const MAX_SPEED = 2.5;
export const PRESET_SPEEDS = [1.25, 1.5, 2] as const;

const ATEMPO_MIN = 0.5;
const ATEMPO_MAX = 2;
const OUTPUT_BITRATE_KBPS = 192;

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isSupportedSpeedFile(file: File): boolean {
  return isSupportedAudioTrimFile(file);
}

export function validateSpeedFactor(speed: number): number {
  if (!Number.isFinite(speed)) {
    throw new Error(`Invalid speed value. Choose a factor between ${MIN_SPEED}x and ${MAX_SPEED}x.`);
  }
  if (speed < MIN_SPEED || speed > MAX_SPEED) {
    throw new Error(
      `Speed must stay between ${MIN_SPEED}x and ${MAX_SPEED}x for stable time-stretching quality.`,
    );
  }
  return speed;
}

/**
 * Build an atempo filter chain. Each atempo instance accepts 0.5–2.0;
 * values outside that range are split into chained filters (e.g. 2.5× → atempo=2,atempo=1.25).
 */
export function buildAtempoFilterChain(speed: number): string {
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new Error("Invalid speed value for atempo.");
  }

  if (Math.abs(speed - 1) < 0.001) {
    return "atempo=1.0";
  }

  const parts: string[] = [];
  let remaining = speed;

  while (remaining < ATEMPO_MIN - 1e-9) {
    parts.push(`atempo=${ATEMPO_MIN}`);
    remaining /= ATEMPO_MIN;
  }

  while (remaining > ATEMPO_MAX + 1e-9) {
    parts.push(`atempo=${ATEMPO_MAX}`);
    remaining /= ATEMPO_MAX;
  }

  const formatted = Number(remaining.toFixed(4));
  parts.push(`atempo=${formatted}`);
  return parts.join(",");
}

/**
 * Tape-style speed change: duration and pitch both scale with `speed`
 * (sample-rate retarget + resample back to original rate).
 */
export function buildPitchLinkedRateFilter(speed: number, sampleRate: number): string {
  const sr = Math.max(8000, Math.min(192000, Math.round(sampleRate) || 44100));
  const rate = Math.round(sr * speed);
  return `asetrate=${rate},aresample=${sr}`;
}

function buildEncodeTail(format: AudioTrimFormat, outputName: string): string[] {
  switch (format) {
    case "wav":
      return ["-codec:a", "pcm_s16le", outputName];
    case "ogg":
      return ["-codec:a", "libvorbis", "-q:a", "5", outputName];
    case "aac":
    case "m4a":
      return ["-codec:a", "aac", "-b:a", `${OUTPUT_BITRATE_KBPS}k`, outputName];
    case "mp3":
    default:
      return ["-codec:a", "libmp3lame", "-b:a", `${OUTPUT_BITRATE_KBPS}k`, outputName];
  }
}

export function buildChangeAudioSpeedArgs(
  inputName: string,
  outputName: string,
  format: AudioTrimFormat,
  speed: number,
  maintainPitch: boolean,
  sampleRate: number,
): string[] {
  const filter = maintainPitch
    ? buildAtempoFilterChain(speed)
    : buildPitchLinkedRateFilter(speed, sampleRate);

  return ["-i", inputName, "-filter:a", filter, ...buildEncodeTail(format, outputName)];
}

/** @deprecated Prefer buildChangeAudioSpeedArgs */
export function buildChangeMp3SpeedArgs(
  inputName: string,
  outputName: string,
  speed: number,
): string[] {
  return buildChangeAudioSpeedArgs(inputName, outputName, "mp3", speed, true, 44100);
}

async function detectSampleRate(file: File): Promise<number> {
  const AudioCtx =
    typeof window !== "undefined"
      ? window.AudioContext || window.webkitAudioContext
      : undefined;
  if (!AudioCtx) return 44100;

  const ctx = new AudioCtx();
  try {
    const buffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(buffer.slice(0));
    return decoded.sampleRate || 44100;
  } catch {
    return 44100;
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

/**
 * Change audio speed locally with ffmpeg.wasm.
 * Maintain pitch → WSOLA-like atempo chain (time-stretch).
 * Pitch linked → asetrate/aresample (tape effect).
 */
export async function changeAudioSpeed(
  file: File,
  options: ChangeAudioSpeedOptions,
): Promise<Blob> {
  const meta = detectAudioTrimFormat(file);
  if (!meta) {
    throw new Error(
      `Invalid or unsupported file "${file.name}". Upload MP3, WAV, AAC/M4A, or OGG.`,
    );
  }

  validateSpeedFactor(options.speed);
  const maintainPitch = options.maintainPitch !== false;

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = `input.${meta.inputExt}`;
  const outputName = `output.${meta.extension}`;

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const sampleRate = maintainPitch ? 44100 : await detectSampleRate(file);
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(
        buildChangeAudioSpeedArgs(
          inputName,
          outputName,
          meta.format,
          options.speed,
          maintainPitch,
          sampleRate,
        ),
      );
      const outputBytes = await ffmpeg.readFile(outputName);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return new Blob([copy], { type: meta.mimeType });
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

/** @deprecated Use changeAudioSpeed */
export async function changeMp3Speed(
  file: File,
  options: ChangeAudioSpeedOptions,
): Promise<Blob> {
  return changeAudioSpeed(file, options);
}

export function speedChangedOutputFileName(inputName: string, speed: number): string {
  const extMatch = /\.([^.]+)$/.exec(inputName);
  const extension = (extMatch?.[1] || "mp3").toLowerCase();
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  const label = Number.isInteger(speed) ? `${speed}x` : `${speed.toFixed(2).replace(/\.?0+$/, "")}x`;
  return `${base}-${label}.${extension}`;
}
