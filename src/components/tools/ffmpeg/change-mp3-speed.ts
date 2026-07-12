import { fetchFile } from "@ffmpeg/util";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type ChangeMp3SpeedOptions = {
  speed: number;
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

export const MIN_SPEED = 0.5;
export const MAX_SPEED = 2;
const ATEMPO_MIN = 0.5;
const ATEMPO_MAX = 2;
const OUTPUT_BITRATE_KBPS = 192;

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function validateSpeedFactor(speed: number): number {
  if (!Number.isFinite(speed)) {
    throw new Error("Invalid speed value. Choose a factor between 0.5x and 2.0x.");
  }
  if (speed < MIN_SPEED || speed > MAX_SPEED) {
    throw new Error(
      `Speed must stay between ${MIN_SPEED}x and ${MAX_SPEED}x. FFmpeg atempo is chained within this range for quality.`,
    );
  }
  return speed;
}

/**
 * Build an atempo filter chain. Each atempo instance accepts 0.5–2.0;
 * values outside that range are split into chained filters (e.g. 4× → atempo=2,atempo=2).
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

export function buildChangeMp3SpeedArgs(
  inputName: string,
  outputName: string,
  speed: number,
): string[] {
  return [
    "-i",
    inputName,
    "-filter:a",
    buildAtempoFilterChain(speed),
    "-codec:a",
    "libmp3lame",
    "-b:a",
    `${OUTPUT_BITRATE_KBPS}k`,
    outputName,
  ];
}

export async function changeMp3Speed(file: File, options: ChangeMp3SpeedOptions): Promise<Blob> {
  if (!isMp3File(file)) {
    throw new Error(
      "Invalid or unsupported file. Please upload a valid MP3 audio file for speed adjustment.",
    );
  }

  validateSpeedFactor(options.speed);

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = "input.mp3";
  const outputName = "output.mp3";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(buildChangeMp3SpeedArgs(inputName, outputName, options.speed));
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

export function speedChangedOutputFileName(inputName: string, speed: number): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  const label = speed % 1 === 0 ? `${speed}x` : `${speed.toFixed(1)}x`;
  return `${base}-${label}.mp3`;
}
