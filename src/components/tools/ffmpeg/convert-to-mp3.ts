import { fetchFile } from "@ffmpeg/util";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

const SUPPORTED_INPUT_EXTENSIONS = new Set(["wav", "ogg", "aac", "m4a", "mp3", "flac", "wma", "opus"]);

export type AudioToMp3Options = {
  bitrateKbps: number;
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

function extensionFromFile(file: File): string {
  const fromName = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  if (fromName && SUPPORTED_INPUT_EXTENSIONS.has(fromName)) {
    return fromName === "m4a" ? "m4a" : fromName;
  }

  const mimeMap: Record<string, string> = {
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/aac": "aac",
    "audio/mp4": "m4a",
    "audio/m4a": "m4a",
    "audio/mpeg": "mp3",
    "audio/flac": "flac",
    "audio/webm": "ogg",
  };

  return mimeMap[file.type] ?? "bin";
}

export function isSupportedMp3Source(file: File): boolean {
  const ext = extensionFromFile(file);
  if (ext !== "bin") return true;
  return file.type.startsWith("audio/");
}

/** FFmpeg args for WAV / OGG / AAC (and similar) → MP3. */
export function buildAudioToMp3Args(
  inputName: string,
  outputName: string,
  bitrateKbps: number,
): string[] {
  return [
    "-i",
    inputName,
    "-vn",
    "-codec:a",
    "libmp3lame",
    "-b:a",
    `${bitrateKbps}k`,
    outputName,
  ];
}

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

/**
 * Local-first audio → MP3 conversion via ffmpeg.wasm in a dedicated worker.
 * Uses `fetchFile` so file bytes are prepared for the worker without blocking the UI thread.
 */
export async function convertAudioFileToMp3(file: File, options: AudioToMp3Options): Promise<Blob> {
  if (!isSupportedMp3Source(file)) {
    throw new Error("Unsupported audio format. Use WAV, OGG, AAC, M4A, or MP3.");
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const ext = extensionFromFile(file);
  const inputName = `input.${ext}`;
  const outputName = "output.mp3";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    const inputBytes = toUint8Array(fetched);
    await ffmpeg.writeFile(inputName, inputBytes);

    try {
      await ffmpeg.exec(buildAudioToMp3Args(inputName, outputName, options.bitrateKbps));
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
  return `${base}-converted.mp3`;
}
