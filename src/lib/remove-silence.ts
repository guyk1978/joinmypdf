/**
 * Client-side silence detection & removal via Web Audio API (RMS analysis).
 * No server uploads — all work stays in the browser.
 */

export type TimeSegment = {
  start: number;
  end: number;
};

export type SilenceAnalysis = {
  duration: number;
  sampleRate: number;
  channels: number;
  /** Downsampled amplitude envelope 0–1 for UI (active energy). */
  envelope: number[];
  /** Same resolution: true when the hop is below threshold. */
  silentFlags: boolean[];
  silenceSegments: TimeSegment[];
  keepSegments: TimeSegment[];
  silenceSeconds: number;
  keepSeconds: number;
  hopSeconds: number;
};

export type RemoveSilenceOptions = {
  /** Amplitude at or below this dBFS is treated as silence. Default −40. */
  thresholdDb?: number;
  /** Minimum continuous silence length to remove (seconds). Default 0.5. */
  minSilenceSeconds?: number;
  /** Analysis hop in seconds (smaller = finer, slower). Default ~0.02. */
  hopSeconds?: number;
  onProgress?: (ratio: number) => void;
};

export const DEFAULT_THRESHOLD_DB = -40;
export const MIN_THRESHOLD_DB = -60;
export const MAX_THRESHOLD_DB = -20;

export const DEFAULT_MIN_SILENCE = 0.5;
export const MIN_MIN_SILENCE = 0.2;
export const MAX_MIN_SILENCE = 2;

const VISUAL_BARS = 240;
const YIELD_EVERY_FRAMES = 4000;

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return window.AudioContext || window.webkitAudioContext;
}

export function isSupportedSilenceFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (
    type.startsWith("audio/") ||
    type === "video/mp4" ||
    type === "application/ogg"
  ) {
    return true;
  }
  return /\.(mp3|wav|wave|ogg|oga|aac|m4a|flac|opus)$/i.test(file.name);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rmsToDb(rms: number): number {
  if (rms <= 1e-10) return -100;
  return 20 * Math.log10(rms);
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const AudioCtx = getAudioContextCtor();
  if (!AudioCtx) {
    throw new Error("Web Audio API is not available in this browser.");
  }

  const ctx = new AudioCtx();
  try {
    const bytes = await file.arrayBuffer();
    return await ctx.decodeAudioData(bytes.slice(0));
  } catch {
    throw new Error(
      `Could not decode "${file.name}". Please upload a valid MP3, WAV, AAC, or OGG file.`,
    );
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

/**
 * Mix channels to mono RMS energy for analysis (efficient for long podcasts).
 */
function buildMonoEnergy(buffer: AudioBuffer): Float32Array {
  const { length, numberOfChannels } = buffer;
  const mono = new Float32Array(length);

  if (numberOfChannels === 1) {
    mono.set(buffer.getChannelData(0));
    return mono;
  }

  const channels: Float32Array[] = [];
  for (let c = 0; c < numberOfChannels; c += 1) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < length; i += 1) {
    let sum = 0;
    for (let c = 0; c < numberOfChannels; c += 1) {
      sum += channels[c]![i]!;
    }
    mono[i] = sum / numberOfChannels;
  }

  return mono;
}

function invertSegments(silence: TimeSegment[], duration: number): TimeSegment[] {
  const sorted = [...silence].sort((a, b) => a.start - b.start);
  const keep: TimeSegment[] = [];
  let cursor = 0;

  for (const seg of sorted) {
    if (seg.start > cursor + 1e-4) {
      keep.push({ start: cursor, end: seg.start });
    }
    cursor = Math.max(cursor, seg.end);
  }

  if (cursor < duration - 1e-4) {
    keep.push({ start: cursor, end: duration });
  }

  return keep.filter((seg) => seg.end - seg.start > 1e-4);
}

/**
 * Analyze RMS amplitude and mark silence that exceeds min duration.
 * Yields periodically so a 1-hour podcast stays responsive.
 */
export async function analyzeSilence(
  buffer: AudioBuffer,
  options: RemoveSilenceOptions = {},
): Promise<SilenceAnalysis> {
  const thresholdDb = clamp(
    options.thresholdDb ?? DEFAULT_THRESHOLD_DB,
    MIN_THRESHOLD_DB,
    MAX_THRESHOLD_DB,
  );
  const minSilenceSeconds = clamp(
    options.minSilenceSeconds ?? DEFAULT_MIN_SILENCE,
    MIN_MIN_SILENCE,
    MAX_MIN_SILENCE,
  );
  const hopSeconds = clamp(options.hopSeconds ?? 0.02, 0.01, 0.1);
  const hopSamples = Math.max(1, Math.round(buffer.sampleRate * hopSeconds));
  const mono = buildMonoEnergy(buffer);
  const frameCount = Math.ceil(mono.length / hopSamples);
  const frameDb = new Float32Array(frameCount);
  const silentFlags = new Array<boolean>(frameCount);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = frame * hopSamples;
    const end = Math.min(mono.length, start + hopSamples);
    let sumSq = 0;
    const count = end - start;
    for (let i = start; i < end; i += 1) {
      const v = mono[i]!;
      sumSq += v * v;
    }
    const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
    frameDb[frame] = rmsToDb(rms);
    silentFlags[frame] = frameDb[frame]! <= thresholdDb;

    if (frame > 0 && frame % YIELD_EVERY_FRAMES === 0) {
      options.onProgress?.(frame / frameCount);
      await yieldToMain();
    }
  }

  options.onProgress?.(0.85);

  const silenceSegments: TimeSegment[] = [];
  let runStart: number | null = null;

  for (let frame = 0; frame <= frameCount; frame += 1) {
    const isSilent = frame < frameCount ? silentFlags[frame]! : false;
    if (isSilent && runStart === null) {
      runStart = frame;
    } else if (!isSilent && runStart !== null) {
      const start = runStart * hopSeconds;
      const end = frame * hopSeconds;
      if (end - start >= minSilenceSeconds - 1e-6) {
        silenceSegments.push({
          start,
          end: Math.min(buffer.duration, end),
        });
      }
      runStart = null;
    }
  }

  const keepSegments = invertSegments(silenceSegments, buffer.duration);
  const silenceSeconds = silenceSegments.reduce((sum, s) => sum + (s.end - s.start), 0);
  const keepSeconds = keepSegments.reduce((sum, s) => sum + (s.end - s.start), 0);

  const envelope: number[] = [];
  const visualSilent: boolean[] = [];
  for (let i = 0; i < VISUAL_BARS; i += 1) {
    const t0 = (i / VISUAL_BARS) * buffer.duration;
    const t1 = ((i + 1) / VISUAL_BARS) * buffer.duration;
    const mid = (t0 + t1) / 2;
    const f0 = Math.floor(t0 / hopSeconds);
    const f1 = Math.min(frameCount, Math.ceil(t1 / hopSeconds));
    let peak = 0;
    for (let f = f0; f < f1; f += 1) {
      const linear = Math.pow(10, frameDb[f]! / 20);
      peak = Math.max(peak, linear);
    }
    envelope.push(clamp(peak, 0, 1));
    visualSilent.push(
      silenceSegments.some((seg) => mid >= seg.start && mid < seg.end),
    );
  }

  options.onProgress?.(1);

  return {
    duration: buffer.duration,
    sampleRate: buffer.sampleRate,
    channels: buffer.numberOfChannels,
    envelope,
    silentFlags: visualSilent,
    silenceSegments,
    keepSegments,
    silenceSeconds,
    keepSeconds,
    hopSeconds,
  };
}

/**
 * Reconstruct audio by stitching only non-silent (keep) segments.
 */
export function stitchKeepSegments(
  source: AudioBuffer,
  keepSegments: TimeSegment[],
): AudioBuffer {
  if (keepSegments.length === 0) {
    throw new Error(
      "No audible audio left after silence removal. Raise the threshold (e.g. −50 dB) or increase minimum duration.",
    );
  }

  const AudioCtx = getAudioContextCtor();
  if (!AudioCtx) {
    throw new Error("Web Audio API is not available in this browser.");
  }

  const sampleRate = source.sampleRate;
  const channels = source.numberOfChannels;
  let totalSamples = 0;
  const ranges = keepSegments.map((seg) => {
    const start = clamp(Math.floor(seg.start * sampleRate), 0, source.length);
    const end = clamp(Math.ceil(seg.end * sampleRate), start, source.length);
    totalSamples += end - start;
    return { start, end };
  });

  if (totalSamples < 1) {
    throw new Error("Resulting audio is empty. Adjust silence settings and try again.");
  }

  const ctx = new AudioCtx({ sampleRate });
  try {
    const out = ctx.createBuffer(channels, totalSamples, sampleRate);
    for (let c = 0; c < channels; c += 1) {
      const src = source.getChannelData(c);
      const dest = out.getChannelData(c);
      let write = 0;
      for (const range of ranges) {
        const slice = src.subarray(range.start, range.end);
        dest.set(slice, write);
        write += slice.length;
      }
    }
    return out;
  } finally {
    void ctx.close().catch(() => undefined);
  }
}

/** Encode PCM AudioBuffer as a 16-bit WAV Blob. */
export function encodeWavBlob(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData: Float32Array[] = [];
  for (let c = 0; c < channels; c += 1) {
    channelData.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < length; i += 1) {
    for (let c = 0; c < channels; c += 1) {
      const sample = clamp(channelData[c]![i]!, -1, 1);
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export function cleanedOutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}-silence-removed.wav`;
}

export function formatDurationLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
