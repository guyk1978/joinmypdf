import { fetchFile } from "@ffmpeg/util";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type RemoveVocalsOptions = {
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

const OUTPUT_BITRATE_KBPS = 192;

/**
 * Center-channel phase cancellation — best lightweight local technique in ffmpeg.wasm.
 * Vocals are often center-panned in stereo mixes; subtracting L−R / R−L attenuates the center.
 * This is an estimation, not true stem separation.
 */
export const VOCAL_REMOVAL_AUDIO_FILTER = "pan=stereo|c0=c0-c1|c1=c1-c0";

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isVoiceRemoveInputFile(file: File): boolean {
  if (isMp3File(file)) return true;
  if (file.type === "audio/wav" || file.type === "audio/x-wav" || /\.wav$/i.test(file.name)) {
    return true;
  }
  if (
    file.type === "audio/mp4" ||
    file.type === "audio/x-m4a" ||
    file.type === "audio/m4a" ||
    /\.m4a$/i.test(file.name)
  ) {
    return true;
  }
  return false;
}

export function inputNameForVoiceRemoveFile(file: File): string {
  if (/\.wav$/i.test(file.name)) return "input.wav";
  if (/\.m4a$/i.test(file.name)) return "input.m4a";
  return "input.mp3";
}

export function buildRemoveVocalsArgs(inputName: string, outputName: string): string[] {
  return [
    "-i",
    inputName,
    "-af",
    VOCAL_REMOVAL_AUDIO_FILTER,
    "-codec:a",
    "libmp3lame",
    "-b:a",
    `${OUTPUT_BITRATE_KBPS}k`,
    outputName,
  ];
}

export async function removeVocalsFromAudio(
  file: File,
  options: RemoveVocalsOptions = {},
): Promise<Blob> {
  if (!isVoiceRemoveInputFile(file)) {
    throw new Error(
      "Invalid or unsupported file. Please upload a stereo MP3, WAV, or M4A track for vocal removal.",
    );
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = inputNameForVoiceRemoveFile(file);
  const outputName = "output.mp3";

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(buildRemoveVocalsArgs(inputName, outputName));
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

export function instrumentalOutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}-instrumental.mp3`;
}
