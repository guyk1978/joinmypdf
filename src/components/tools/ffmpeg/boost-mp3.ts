import { fetchFile } from "@ffmpeg/util";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";

export type BoostMp3Options = {
  /** Linear gain from 1× (normalize only) to 3× (stronger boost). */
  boostLevel: number;
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

const MIN_BOOST = 1;
const MAX_BOOST = 3;
const OUTPUT_BITRATE_KBPS = 192;

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

function clampBoostLevel(boostLevel: number): number {
  return Math.min(MAX_BOOST, Math.max(MIN_BOOST, boostLevel));
}

export function buildSimpleLoudnormArgs(inputName: string, outputName: string): string[] {
  return ["-i", inputName, "-filter:a", "loudnorm", outputName];
}

/**
 * `loudnorm` caps true peak to prevent clipping.
 * Above 1× we add a pre-gain `volume` stage, then loudnorm polishes dynamics.
 */
export function buildMp3BoostFilter(boostLevel: number): string {
  const level = clampBoostLevel(boostLevel);

  if (level <= 1.01) {
    return "loudnorm=I=-23:TP=-1.5:LRA=11";
  }

  return `volume=${level.toFixed(2)},loudnorm=I=-16:TP=-1.5:LRA=11`;
}

export function buildMp3BoostArgs(
  inputName: string,
  outputName: string,
  boostLevel: number,
): string[] {
  const level = clampBoostLevel(boostLevel);

  if (level <= 1.01) {
    return buildSimpleLoudnormArgs(inputName, outputName);
  }

  return [
    "-i",
    inputName,
    "-filter:a",
    buildMp3BoostFilter(boostLevel),
    "-codec:a",
    "libmp3lame",
    "-b:a",
    `${OUTPUT_BITRATE_KBPS}k`,
    outputName,
  ];
}

/**
 * Boost MP3 loudness locally with ffmpeg.wasm (`loudnorm` anti-clipping).
 */
export async function boostMp3File(file: File, options: BoostMp3Options): Promise<Blob> {
  if (!isMp3File(file)) {
    throw new Error(
      "Invalid or unsupported file. Please upload a valid MP3 audio file for volume boosting.",
    );
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = "input.mp3";
  const outputName = "output.mp3";
  const boostLevel = clampBoostLevel(options.boostLevel);

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    const inputBytes = toUint8Array(fetched);
    await ffmpeg.writeFile(inputName, inputBytes);

    try {
      await ffmpeg.exec(buildMp3BoostArgs(inputName, outputName, boostLevel));
      const outputBytes = await ffmpeg.readFile(outputName);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return new Blob([copy], { type: "audio/mpeg" });
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

export function mp3BoostOutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}-boosted.mp3`;
}

export { MIN_BOOST, MAX_BOOST };
