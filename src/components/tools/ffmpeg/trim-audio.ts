import { fetchFile } from "@ffmpeg/util";
import { buildAfadeFilter } from "@/components/tools/ffmpeg/fade-audio";
import { secondsToFfmpegTimestamp } from "@/services/media/types";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type AudioTrimFormat = "mp3" | "wav" | "ogg" | "aac" | "m4a";

export type TrimAudioOptions = {
  startSeconds: number;
  endSeconds: number;
  /** Soft edges applied on the trimmed segment (seconds). */
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

type FormatMeta = {
  format: AudioTrimFormat;
  extension: string;
  mimeType: string;
  inputExt: string;
};

const FORMAT_BY_EXT: Record<string, FormatMeta> = {
  mp3: { format: "mp3", extension: "mp3", mimeType: "audio/mpeg", inputExt: "mp3" },
  wav: { format: "wav", extension: "wav", mimeType: "audio/wav", inputExt: "wav" },
  wave: { format: "wav", extension: "wav", mimeType: "audio/wav", inputExt: "wav" },
  ogg: { format: "ogg", extension: "ogg", mimeType: "audio/ogg", inputExt: "ogg" },
  oga: { format: "ogg", extension: "ogg", mimeType: "audio/ogg", inputExt: "ogg" },
  aac: { format: "aac", extension: "aac", mimeType: "audio/aac", inputExt: "aac" },
  m4a: { format: "m4a", extension: "m4a", mimeType: "audio/mp4", inputExt: "m4a" },
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

function extensionFromName(fileName: string): string {
  const match = /\.([^.]+)$/.exec(fileName);
  return match?.[1]?.toLowerCase() ?? "";
}

export function detectAudioTrimFormat(file: File): FormatMeta | null {
  const byExt = FORMAT_BY_EXT[extensionFromName(file.name)];
  if (byExt) return byExt;

  const type = file.type.toLowerCase();
  if (type === "audio/mpeg" || type === "audio/mp3") return FORMAT_BY_EXT.mp3!;
  if (type === "audio/wav" || type === "audio/wave" || type === "audio/x-wav") return FORMAT_BY_EXT.wav!;
  if (type === "audio/ogg" || type === "application/ogg") return FORMAT_BY_EXT.ogg!;
  if (type === "audio/aac") return FORMAT_BY_EXT.aac!;
  if (type === "audio/mp4" || type === "audio/x-m4a") return FORMAT_BY_EXT.m4a!;
  return null;
}

export function isSupportedAudioTrimFile(file: File): boolean {
  return Boolean(detectAudioTrimFormat(file));
}

export function buildEncodeArgs(
  format: AudioTrimFormat,
  inputName: string,
  outputName: string,
  startSeconds: number,
  endSeconds: number,
  fadeInSeconds: number,
  fadeOutSeconds: number,
): string[] {
  const segmentDuration = Math.max(0, endSeconds - startSeconds);
  const useFade = fadeInSeconds > 0 || fadeOutSeconds > 0;

  // Seek after -i so optional afade sees the trimmed segment timeline.
  const args = [
    "-i",
    inputName,
    "-ss",
    secondsToFfmpegTimestamp(startSeconds),
    "-to",
    secondsToFfmpegTimestamp(endSeconds),
  ];

  if (!useFade) {
    args.push("-c", "copy", outputName);
    return args;
  }

  const fadeIn = Math.min(Math.max(fadeInSeconds, 0.05), segmentDuration / 2);
  const fadeOut = Math.min(Math.max(fadeOutSeconds, 0.05), segmentDuration / 2);
  args.push("-af", buildAfadeFilter(fadeIn, fadeOut, segmentDuration));

  switch (format) {
    case "mp3":
      args.push("-codec:a", "libmp3lame", "-q:a", "2");
      break;
    case "wav":
      args.push("-codec:a", "pcm_s16le");
      break;
    case "ogg":
      args.push("-codec:a", "libvorbis", "-q:a", "5");
      break;
    case "aac":
    case "m4a":
      args.push("-codec:a", "aac", "-b:a", "192k");
      break;
  }

  args.push(outputName);
  return args;
}

/**
 * Trim MP3/WAV/AAC/OGG locally with ffmpeg.wasm.
 * Stream-copies when no fade is applied; re-encodes when Fade In/Out is enabled.
 */
export async function trimAudioFile(file: File, options: TrimAudioOptions): Promise<{ blob: Blob; fileName: string }> {
  const meta = detectAudioTrimFormat(file);
  if (!meta) {
    throw new Error("Unsupported format. Upload MP3, WAV, AAC/M4A, or OGG.");
  }

  if (options.startSeconds >= options.endSeconds) {
    throw new Error("Start time must be earlier than end time.");
  }

  const fadeIn = Math.max(0, options.fadeInSeconds ?? 0);
  const fadeOut = Math.max(0, options.fadeOutSeconds ?? 0);
  const segmentDuration = options.endSeconds - options.startSeconds;
  if (fadeIn + fadeOut > segmentDuration) {
    throw new Error("Fade in and fade out together exceed the trimmed segment length.");
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = `input.${meta.inputExt}`;
  const outputName = `output.${meta.extension}`;

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(
        buildEncodeArgs(
          meta.format,
          inputName,
          outputName,
          options.startSeconds,
          options.endSeconds,
          fadeIn,
          fadeOut,
        ),
      );
      const outputBytes = await ffmpeg.readFile(outputName);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      const blob = new Blob([copy], { type: meta.mimeType });
      return { blob, fileName: audioTrimOutputFileName(file.name, meta.extension) };
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

export function audioTrimOutputFileName(inputName: string, extension: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}-trimmed.${extension}`;
}
