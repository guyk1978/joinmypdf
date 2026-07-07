import { fetchFile } from "@ffmpeg/util";
import { secondsToFfmpegTimestamp } from "@/services/media/types";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type TrimMp3Options = {
  startSeconds: number;
  endSeconds: number;
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isMp3File(file: File): boolean {
  if (file.type === "audio/mpeg" || file.type === "audio/mp3") return true;
  return /\.mp3$/i.test(file.name);
}

/** Stream-copy trim — fast, lossless segment extraction. */
export function buildMp3TrimArgs(
  inputName: string,
  outputName: string,
  startSeconds: number,
  endSeconds: number,
): string[] {
  return [
    "-i",
    inputName,
    "-ss",
    secondsToFfmpegTimestamp(startSeconds),
    "-to",
    secondsToFfmpegTimestamp(endSeconds),
    "-c",
    "copy",
    outputName,
  ];
}

/**
 * Trim an MP3 locally with ffmpeg.wasm (`-c copy` stream copy).
 * Uses `fetchFile` so bytes are staged for the worker without blocking the UI thread.
 */
export async function trimMp3File(file: File, options: TrimMp3Options): Promise<Blob> {
  if (!isMp3File(file)) {
    throw new Error("Please upload an MP3 file. Stream-copy trimming requires MP3 input.");
  }

  if (options.startSeconds >= options.endSeconds) {
    throw new Error("Start time must be earlier than end time.");
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
      await ffmpeg.exec(
        buildMp3TrimArgs(inputName, outputName, options.startSeconds, options.endSeconds),
      );
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

export function mp3TrimOutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}-trimmed.mp3`;
}
