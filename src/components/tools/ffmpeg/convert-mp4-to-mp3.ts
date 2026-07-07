import { fetchFile } from "@ffmpeg/util";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type Mp4ToMp3Options = {
  onPhase?: (phase: "loading" | "processing" | "validating") => void;
  onProgress?: (ratio: number) => void;
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isMp4File(file: File): boolean {
  if (file.type === "video/mp4" || file.type === "application/mp4") {
    return true;
  }
  return /\.mp4$/i.test(file.name);
}

function hasMp4FtypHeader(header: Uint8Array): boolean {
  if (header.byteLength < 8) return false;
  return (
    header[4] === 0x66 &&
    header[5] === 0x74 &&
    header[6] === 0x79 &&
    header[7] === 0x70
  );
}

export async function validateMp4Integrity(file: File): Promise<void> {
  if (!isMp4File(file)) {
    throw new Error("Unsupported file type. Please upload a valid MP4 (.mp4) video file.");
  }

  if (file.size < 12) {
    throw new Error(
      `"${file.name}" is too small to be a valid MP4 file. The file may be empty or corrupted.`,
    );
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasMp4FtypHeader(header)) {
    throw new Error(
      `"${file.name}" does not appear to be a valid MP4 container. The file may be corrupted or mislabeled.`,
    );
  }
}

/** FFmpeg args for MP4 → MP3 audio extraction with high VBR quality. */
export function buildMp4ToMp3Args(inputName: string, outputName: string): string[] {
  return ["-i", inputName, "-vn", "-acodec", "libmp3lame", "-q:a", "2", outputName];
}

export function formatMp4ToMp3Error(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (
    lower.includes("codec not found") ||
    lower.includes("unknown encoder") ||
    lower.includes("could not find codec")
  ) {
    return "This MP4 uses an audio codec that cannot be decoded in your browser's FFmpeg build. Try re-exporting the video with AAC audio, or use a shorter clip.";
  }

  if (lower.includes("does not contain any stream") || lower.includes("no audio")) {
    return "No audio track was found in this MP4. Upload a video file that includes an audio stream.";
  }

  if (lower.includes("invalid data") || lower.includes("error while decoding")) {
    return "Could not decode audio from this MP4. The file may be corrupted or DRM-protected—re-export from your editor and try again.";
  }

  if (lower.includes("out of memory") || lower.includes("oom")) {
    return "The browser ran out of memory while extracting audio. Close other tabs or try a shorter video.";
  }

  return raw || "MP4 to MP3 extraction failed.";
}

/**
 * Local-first MP4 → MP3 extraction via ffmpeg.wasm in a dedicated worker.
 */
export async function extractMp3FromMp4(file: File, options: Mp4ToMp3Options = {}): Promise<Blob> {
  options.onPhase?.("validating");
  await validateMp4Integrity(file);

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = "input.mp4";
  const outputName = "output.mp3";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(buildMp4ToMp3Args(inputName, outputName));
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

export function mp4ToMp3OutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}.mp3`;
}
