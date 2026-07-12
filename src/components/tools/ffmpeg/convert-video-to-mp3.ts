import { fetchFile } from "@ffmpeg/util";
import { extensionFromFile } from "@/services/media/types/media.types";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";
import { isAcceptedVideoFile } from "@/lib/video-to-mp4";

export type VideoToMp3Quality = "vbr2" | 128 | 192 | 320;

export const VIDEO_TO_MP3_QUALITY_OPTIONS: readonly VideoToMp3Quality[] = [
  "vbr2",
  128,
  192,
  320,
] as const;

export type VideoToMp3Options = {
  quality?: VideoToMp3Quality;
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isVideoToMp3Input(file: File): boolean {
  return isAcceptedVideoFile(file);
}

/**
 * Default high-quality VBR:
 * `ffmpeg -i input.mp4 -vn -acodec libmp3lame -q:a 2 output.mp3`
 * Optional CBR: `-b:a 128k|192k|320k`
 */
export function buildVideoToMp3Args(
  inputName: string,
  outputName: string,
  quality: VideoToMp3Quality = "vbr2",
): string[] {
  const args = ["-i", inputName, "-vn", "-acodec", "libmp3lame"];

  if (quality === "vbr2") {
    args.push("-q:a", "2");
  } else {
    args.push("-b:a", `${quality}k`);
  }

  args.push(outputName);
  return args;
}

export function formatVideoToMp3Error(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (
    lower.includes("codec not found") ||
    lower.includes("unknown encoder") ||
    lower.includes("could not find codec")
  ) {
    return "This video uses an audio codec that cannot be decoded in your browser's FFmpeg build. Try re-exporting with AAC audio, or use a shorter clip.";
  }

  if (lower.includes("does not contain any stream") || lower.includes("no audio")) {
    return "No audio track was found in this video. Upload a file that includes an audio stream.";
  }

  if (lower.includes("invalid data") || lower.includes("error while decoding")) {
    return "Could not decode audio from this video. The file may be corrupted or DRM-protected—re-export from your editor and try again.";
  }

  if (lower.includes("out of memory") || lower.includes("oom")) {
    return "The browser ran out of memory while extracting audio. Close other tabs or try a shorter video.";
  }

  return raw || "Video to MP3 extraction failed.";
}

/**
 * Local-first video → MP3 extraction via ffmpeg.wasm (`-vn` drops video; libmp3lame encodes audio).
 */
export async function extractMp3FromVideo(
  file: File,
  options: VideoToMp3Options = {},
): Promise<Blob> {
  if (!isVideoToMp3Input(file)) {
    throw new Error("Please upload a supported video file (MP4, MOV, WEBM, MKV, AVI, and similar).");
  }

  const quality = options.quality ?? "vbr2";
  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const ext = extensionFromFile(file) || "mp4";
  const inputName = `input.${ext}`;
  const outputName = "output.mp3";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(buildVideoToMp3Args(inputName, outputName, quality));
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

export function videoToMp3OutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "").trim() || "audio";
  const safe = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "audio";
  return `${safe}.mp3`;
}
