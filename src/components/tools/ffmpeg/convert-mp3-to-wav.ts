import { fetchFile } from "@ffmpeg/util";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type Mp3ToWavOptions = {
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

/** FFmpeg args for MP3 → uncompressed WAV (PCM). */
export function buildMp3ToWavArgs(inputName: string, outputName: string): string[] {
  return ["-i", inputName, outputName];
}

/**
 * Local-first MP3 → WAV conversion via ffmpeg.wasm in a dedicated worker.
 */
export async function convertMp3FileToWav(file: File, options: Mp3ToWavOptions = {}): Promise<Blob> {
  if (!isMp3File(file)) {
    throw new Error("Unsupported file type. Please upload an MP3 file.");
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = "input.mp3";
  const outputName = "output.wav";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    const inputBytes = toUint8Array(fetched);
    await ffmpeg.writeFile(inputName, inputBytes);

    try {
      await ffmpeg.exec(buildMp3ToWavArgs(inputName, outputName));
      const outputBytes = await ffmpeg.readFile(outputName);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return new Blob([copy], { type: "audio/wav" });
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

export function wavOutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}.wav`;
}
