import { fetchFile } from "@ffmpeg/util";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type WavToMp3Options = {
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isWavFile(file: File): boolean {
  if (
    file.type === "audio/wav" ||
    file.type === "audio/x-wav" ||
    file.type === "audio/wave" ||
    file.type === "audio/vnd.wave"
  ) {
    return true;
  }
  return /\.wav$/i.test(file.name);
}

/** FFmpeg args for WAV → MP3 with highest VBR quality (libmp3lame -q:a 0). */
export function buildWavToMp3Args(inputName: string, outputName: string): string[] {
  return ["-i", inputName, "-q:a", "0", outputName];
}

/**
 * Local-first WAV → MP3 conversion via ffmpeg.wasm in a dedicated worker.
 */
export async function convertWavFileToMp3(file: File, options: WavToMp3Options = {}): Promise<Blob> {
  if (!isWavFile(file)) {
    throw new Error("Unsupported file type. Please upload a valid WAV file.");
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = "input.wav";
  const outputName = "output.mp3";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    const inputBytes = toUint8Array(fetched);
    await ffmpeg.writeFile(inputName, inputBytes);

    try {
      await ffmpeg.exec(buildWavToMp3Args(inputName, outputName));
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

export function mp3OutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}.mp3`;
}
