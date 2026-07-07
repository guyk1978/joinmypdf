import { fetchFile } from "@ffmpeg/util";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type CompressAudioOptions = {
  bitrateKbps: number;
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

/** FFmpeg args for MP3 re-encode at a lower target bitrate. */
export function buildCompressAudioArgs(
  inputName: string,
  outputName: string,
  bitrateKbps: number,
): string[] {
  return ["-i", inputName, "-b:a", `${bitrateKbps}k`, outputName];
}

/**
 * Local-first MP3 compression via ffmpeg.wasm in a dedicated worker.
 */
export async function compressAudioFile(file: File, options: CompressAudioOptions): Promise<Blob> {
  if (!isMp3File(file)) {
    throw new Error("Unsupported file type. Please upload an MP3 file.");
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = "input.mp3";
  const outputName = "output.mp3";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    const inputBytes = toUint8Array(fetched);
    await ffmpeg.writeFile(inputName, inputBytes);

    try {
      await ffmpeg.exec(buildCompressAudioArgs(inputName, outputName, options.bitrateKbps));
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

export function compressedOutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}-compressed.mp3`;
}

/** Rough size estimate from duration and target bitrate (bytes). */
export function estimateCompressedBytes(
  durationSeconds: number | null,
  originalBytes: number,
  bitrateKbps: number,
): number {
  if (durationSeconds && durationSeconds > 0) {
    return Math.round(durationSeconds * bitrateKbps * 125 * 1.04);
  }
  return Math.round(originalBytes * (bitrateKbps / 256));
}
