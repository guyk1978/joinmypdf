import { fetchFile } from "@ffmpeg/util";
import { extensionFromFile } from "@/services/media/types/media.types";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type VideoFfmpegOptions = {
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function inputNameForVideo(file: File): string {
  const ext = extensionFromFile(file) || "mp4";
  return `input.${ext}`;
}

export function videoOutputBaseName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/i, "").trim() || "video";
  return base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "video";
}

export async function runVideoFfmpeg(
  file: File,
  buildArgs: (inputName: string, outputName: string) => string[],
  outputName: string,
  mimeType: string,
  options: VideoFfmpegOptions = {},
): Promise<Blob> {
  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;
  const inputName = inputNameForVideo(file);

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(buildArgs(inputName, outputName));
      const outputBytes = await ffmpeg.readFile(outputName);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return new Blob([copy], { type: mimeType });
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

export function formatVideoFfmpegError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (
    lower.includes("worker failed") ||
    lower.includes("worker crashed") ||
    lower.includes("failed to load core") ||
    lower.includes("failed to start")
  ) {
    return "FFmpeg engine failed to load. Use “Reload FFmpeg engine”, then try processing again.";
  }

  if (lower.includes("sharedarraybuffer") || lower.includes("cross-origin")) {
    return "Video processing needs cross-origin isolation (COOP/COEP). Reload after headers are active, or continue in slower single-thread mode.";
  }

  if (lower.includes("out of memory") || lower.includes("oom")) {
    return "The browser ran out of memory while processing video. Close other tabs or try a shorter clip.";
  }

  if (lower.includes("invalid data") || lower.includes("error while decoding")) {
    return "Could not decode this video. The file may be corrupted or use an unsupported codec—re-export and try again.";
  }

  if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("load failed")) {
    return "Could not download FFmpeg engine files. Check your connection, then use “Reload FFmpeg engine”.";
  }

  return raw || "Video processing failed.";
}
