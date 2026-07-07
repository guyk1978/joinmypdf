import { fetchFile } from "@ffmpeg/util";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type OggToMp3Options = {
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isOggFile(file: File): boolean {
  if (
    file.type === "audio/ogg" ||
    file.type === "audio/opus" ||
    file.type === "application/ogg" ||
    file.type === "audio/vorbis"
  ) {
    return true;
  }
  return /\.ogg$/i.test(file.name) || /\.opus$/i.test(file.name);
}

/** FFmpeg args for OGG (Vorbis/Opus) → MP3 with high VBR quality (-q:a 2). */
export function buildOggToMp3Args(inputName: string, outputName: string): string[] {
  return ["-i", inputName, "-q:a", "2", outputName];
}

/**
 * Local-first OGG → MP3 conversion via ffmpeg.wasm in a dedicated worker.
 */
export async function convertOggFileToMp3(file: File, options: OggToMp3Options = {}): Promise<Blob> {
  if (!isOggFile(file)) {
    throw new Error("Unsupported file type. Please upload a valid OGG or Opus file.");
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = "input.ogg";
  const outputName = "output.mp3";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    const inputBytes = toUint8Array(fetched);
    await ffmpeg.writeFile(inputName, inputBytes);

    try {
      await ffmpeg.exec(buildOggToMp3Args(inputName, outputName));
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
