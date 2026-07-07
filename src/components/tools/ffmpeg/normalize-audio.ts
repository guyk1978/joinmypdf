import { fetchFile } from "@ffmpeg/util";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type NormalizeAudioOptions = {
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

export const LOUDNORM_FILTER = "loudnorm=I=-16:TP=-1.5:LRA=11";
const OUTPUT_BITRATE_KBPS = 192;

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function buildNormalizeAudioArgs(inputName: string, outputName: string): string[] {
  return [
    "-i",
    inputName,
    "-filter:a",
    LOUDNORM_FILTER,
    "-codec:a",
    "libmp3lame",
    "-b:a",
    `${OUTPUT_BITRATE_KBPS}k`,
    outputName,
  ];
}

export async function normalizeMp3File(
  file: File,
  options: NormalizeAudioOptions = {},
): Promise<Blob> {
  if (!isMp3File(file)) {
    throw new Error(
      `Invalid file "${file.name}". Please upload valid MP3 files for normalization.`,
    );
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
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(buildNormalizeAudioArgs(inputName, outputName));
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

export function normalizedOutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}-normalized.mp3`;
}

export type NormalizedBatchOutput = {
  fileName: string;
  blob: Blob;
};

export async function normalizedBatchZip(outputs: NormalizedBatchOutput[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const output of outputs) {
    zip.file(output.fileName, output.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function normalizedBatchDownloadName(count: number): string {
  if (count === 1) return "normalized.mp3";
  return `normalized-mp3-${count}-files.zip`;
}
