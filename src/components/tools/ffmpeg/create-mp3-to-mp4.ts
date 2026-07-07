import { fetchFile } from "@ffmpeg/util";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type Mp3ToMp4Options = {
  onPhase?: (phase: "loading" | "processing" | "validating") => void;
  onProgress?: (ratio: number) => void;
};

const SUPPORTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isCoverImageFile(file: File): boolean {
  if (
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp"
  ) {
    return true;
  }
  return /\.(jpe?g|png|webp)$/i.test(file.name);
}

function imageExtension(file: File): string {
  const fromName = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  if (fromName === "jpeg") return "jpg";
  if (fromName && SUPPORTED_IMAGE_EXTENSIONS.has(fromName)) return fromName;

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function validateMp3ToMp4Inputs(mp3File: File, imageFile: File): Promise<void> {
  if (!isMp3File(mp3File)) {
    throw new Error("Please upload a valid MP3 audio file.");
  }

  if (!isCoverImageFile(imageFile)) {
    throw new Error("Please upload a cover image (JPG, PNG, or WebP).");
  }

  if (mp3File.size < 128) {
    throw new Error(`"${mp3File.name}" is too small to be a valid MP3 file.`);
  }

  if (imageFile.size < 64) {
    throw new Error(`"${imageFile.name}" is too small to be a valid image file.`);
  }
}

/** FFmpeg args for static image + MP3 → MP4 (YouTube/social sharing). */
export function buildMp3ToMp4Args(
  imageName: string,
  audioName: string,
  outputName: string,
): string[] {
  return [
    "-loop",
    "1",
    "-i",
    imageName,
    "-i",
    audioName,
    "-c:v",
    "libx264",
    "-tune",
    "stillimage",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-pix_fmt",
    "yuv420p",
    "-shortest",
    outputName,
  ];
}

export function formatMp3ToMp4Error(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (
    lower.includes("codec not found") ||
    lower.includes("unknown encoder") ||
    (lower.includes("libx264") && lower.includes("not found"))
  ) {
    return "H.264 video encoding is not available in this browser's FFmpeg build. Try Chrome or Edge on desktop, or refresh the page after COOP/COEP headers load.";
  }

  if (lower.includes("invalid data") || lower.includes("error while decoding")) {
    return "Could not decode the MP3 or image for video creation. Re-export both files and try again.";
  }

  if (lower.includes("out of memory") || lower.includes("oom")) {
    return "The browser ran out of memory while creating the MP4. Close other tabs or use a shorter MP3 and smaller image.";
  }

  return raw || "MP3 to MP4 video creation failed.";
}

/**
 * Local-first MP3 + cover image → MP4 via ffmpeg.wasm in a dedicated worker.
 */
export async function createMp4FromMp3AndImage(
  mp3File: File,
  imageFile: File,
  options: Mp3ToMp4Options = {},
): Promise<Blob> {
  options.onPhase?.("validating");
  await validateMp3ToMp4Inputs(mp3File, imageFile);

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const imageName = `image.${imageExtension(imageFile)}`;
  const audioName = "input.mp3";
  const outputName = "output.mp4";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const [imageBytes, audioBytes] = await Promise.all([
      fetchFile(imageFile).then(toUint8Array),
      fetchFile(mp3File).then(toUint8Array),
    ]);
    await ffmpeg.writeFile(imageName, imageBytes);
    await ffmpeg.writeFile(audioName, audioBytes);

    try {
      await ffmpeg.exec(buildMp3ToMp4Args(imageName, audioName, outputName));
      const outputBytes = await ffmpeg.readFile(outputName);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return new Blob([copy], { type: "video/mp4" });
    } finally {
      await ffmpeg.deleteFile(imageName).catch(() => undefined);
      await ffmpeg.deleteFile(audioName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

export function mp3ToMp4OutputFileName(mp3Name: string): string {
  const base = mp3Name.replace(/\.[^.]+$/, "") || "audio";
  return `${base}.mp4`;
}
