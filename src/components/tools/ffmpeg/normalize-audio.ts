import { fetchFile } from "@ffmpeg/util";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type NormalizeMode = "loudnorm" | "peak";

export type NormalizeAudioOptions = {
  mode?: NormalizeMode;
  /** Integrated loudness target in LUFS (EBU R128). Typical podcast/streaming: -16. */
  targetLufs?: number;
  /** True-peak ceiling in dBTP. */
  truePeakDb?: number;
  /** Loudness range target for loudnorm. */
  loudnessRange?: number;
  /**
   * Pre-computed gain (dB) for peak mode — usually derived from Web Audio peak analysis
   * so output peak lands near truePeakDb (default -1.0 dBFS).
   */
  peakGainDb?: number;
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

export const DEFAULT_TARGET_LUFS = -16;
export const DEFAULT_TRUE_PEAK_DB = -1.5;
export const DEFAULT_PEAK_TARGET_DB = -1;
export const DEFAULT_LRA = 11;

export const MIN_TARGET_LUFS = -24;
export const MAX_TARGET_LUFS = -9;

const OUTPUT_BITRATE_KBPS = 192;

export type NormalizeFormat = "mp3" | "wav";

type FormatMeta = {
  format: NormalizeFormat;
  extension: string;
  mimeType: string;
  inputExt: string;
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isWavFile(file: File): boolean {
  if (file.type === "audio/wav" || file.type === "audio/wave" || file.type === "audio/x-wav") {
    return true;
  }
  return /\.wav$/i.test(file.name);
}

export function isSupportedNormalizeFile(file: File): boolean {
  return isMp3File(file) || isWavFile(file);
}

export function detectNormalizeFormat(file: File): FormatMeta | null {
  if (isMp3File(file)) {
    return { format: "mp3", extension: "mp3", mimeType: "audio/mpeg", inputExt: "mp3" };
  }
  if (isWavFile(file)) {
    return { format: "wav", extension: "wav", mimeType: "audio/wav", inputExt: "wav" };
  }
  return null;
}

export function buildLoudnormFilter(
  targetLufs = DEFAULT_TARGET_LUFS,
  truePeakDb = DEFAULT_TRUE_PEAK_DB,
  loudnessRange = DEFAULT_LRA,
): string {
  const I = clamp(targetLufs, MIN_TARGET_LUFS, MAX_TARGET_LUFS);
  const TP = clamp(truePeakDb, -3, -0.1);
  const LRA = clamp(loudnessRange, 1, 20);
  return `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}`;
}

/** @deprecated Prefer buildLoudnormFilter with explicit targets. */
export const LOUDNORM_FILTER = buildLoudnormFilter();

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildNormalizeAudioArgs(
  inputName: string,
  outputName: string,
  format: NormalizeFormat,
  options: NormalizeAudioOptions = {},
): string[] {
  const mode = options.mode ?? "loudnorm";
  const args = ["-i", inputName, "-filter:a"];

  if (mode === "peak") {
    const gain = Number.isFinite(options.peakGainDb) ? options.peakGainDb! : 0;
    const safeGain = clamp(gain, -24, 24);
    args.push(`volume=${safeGain.toFixed(3)}dB`);
  } else {
    args.push(
      buildLoudnormFilter(
        options.targetLufs ?? DEFAULT_TARGET_LUFS,
        options.truePeakDb ?? DEFAULT_TRUE_PEAK_DB,
        options.loudnessRange ?? DEFAULT_LRA,
      ),
    );
  }

  if (format === "wav") {
    args.push("-codec:a", "pcm_s16le", outputName);
  } else {
    args.push("-codec:a", "libmp3lame", "-b:a", `${OUTPUT_BITRATE_KBPS}k`, outputName);
  }

  return args;
}

/**
 * Normalize MP3/WAV locally with ffmpeg.wasm.
 * loudnorm mode → EBU R128 targets; peak mode → volume gain toward ~-1 dBFS.
 */
export async function normalizeAudioFile(
  file: File,
  options: NormalizeAudioOptions = {},
): Promise<Blob> {
  const meta = detectNormalizeFormat(file);
  if (!meta) {
    throw new Error(
      `Invalid file "${file.name}". Please upload MP3 or WAV files for normalization.`,
    );
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = `input.${meta.inputExt}`;
  const outputName = `output.${meta.extension}`;

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(buildNormalizeAudioArgs(inputName, outputName, meta.format, options));
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

/** @deprecated Use normalizeAudioFile */
export async function normalizeMp3File(
  file: File,
  options: NormalizeAudioOptions = {},
): Promise<Blob> {
  return normalizeAudioFile(file, options);
}

export function normalizedOutputFileName(inputName: string): string {
  const ext = /\.([^.]+)$/.exec(inputName)?.[1]?.toLowerCase() === "wav" ? "wav" : "mp3";
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}-normalized.${ext}`;
}

export type NormalizedBatchOutput = {
  fileName: string;
  blob: Blob;
};

export async function normalizedBatchZip(outputs: NormalizedBatchOutput[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const output of outputs) {
    zip.file(output.fileName, output.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function normalizedBatchDownloadName(count: number): string {
  if (count === 1) return "normalized-audio";
  return `normalized-audio-${count}-files.zip`;
}

/** Downsample abs-max envelope for before/after amplitude overlays. */
export type AmplitudeAnalysis = {
  peaks: number[];
  peakDb: number;
  rmsDb: number;
};

export async function analyzeAmplitude(
  file: File,
  barCount = 96,
): Promise<AmplitudeAnalysis> {
  const buffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  try {
    const decoded = await audioCtx.decodeAudioData(buffer.slice(0));
    const channel = decoded.getChannelData(0);
    const peaks: number[] = [];
    const block = Math.max(1, Math.floor(channel.length / barCount));
    let peak = 0;
    let sumSq = 0;

    for (let i = 0; i < barCount; i += 1) {
      const start = i * block;
      const end = Math.min(channel.length, start + block);
      let max = 0;
      for (let j = start; j < end; j += 1) {
        const abs = Math.abs(channel[j] ?? 0);
        if (abs > max) max = abs;
        sumSq += abs * abs;
      }
      peaks.push(max);
      if (max > peak) peak = max;
    }

    const rms = Math.sqrt(sumSq / Math.max(1, channel.length));
    return {
      peaks,
      peakDb: amplitudeToDb(peak),
      rmsDb: amplitudeToDb(rms),
    };
  } finally {
    await audioCtx.close().catch(() => undefined);
  }
}

export function amplitudeToDb(amplitude: number): number {
  if (!Number.isFinite(amplitude) || amplitude <= 0) return -100;
  return 20 * Math.log10(amplitude);
}

/** Gain (dB) to push measured peak toward targetPeakDb (default -1 dBFS). */
export function peakGainToTarget(peakDb: number, targetPeakDb = DEFAULT_PEAK_TARGET_DB): number {
  if (!Number.isFinite(peakDb) || peakDb <= -99) return 0;
  return clamp(targetPeakDb - peakDb, -24, 24);
}

/** Scale envelope bars by linear gain for visual “after” preview. */
export function scalePeaks(peaks: number[], gainDb: number): number[] {
  const linear = 10 ** (gainDb / 20);
  return peaks.map((value) => Math.min(1, value * linear));
}
