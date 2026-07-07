import { fetchFile } from "@ffmpeg/util";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type MergeMp3Options = {
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

const LIST_FILE_NAME = "list.txt";
const OUTPUT_FILE_NAME = "output.mp3";

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function inputNameForIndex(index: number): string {
  return `input${index}.mp3`;
}

/** Concat demuxer list file body (`file input0.mp3` per line). */
export function buildConcatListContent(inputNames: readonly string[]): string {
  return inputNames.map((name) => `file ${name}`).join("\n");
}

export function buildConcatMergeArgs(listFileName: string, outputName: string): string[] {
  return ["-f", "concat", "-safe", "0", "-i", listFileName, "-c", "copy", outputName];
}

export function validateMp3FilesForMerge(files: File[]): void {
  if (files.length < 2) {
    throw new Error("Add at least two MP3 files to merge.");
  }

  for (const file of files) {
    if (!isMp3File(file)) {
      throw new Error(
        `Invalid file "${file.name}". All uploads must be valid MP3 files before merging.`,
      );
    }
  }
}

/**
 * Merge multiple MP3 files locally with ffmpeg concat demuxer and stream copy.
 */
export async function mergeMp3Files(files: File[], options: MergeMp3Options = {}): Promise<Blob> {
  validateMp3FilesForMerge(files);

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;
  const inputNames = files.map((_, index) => inputNameForIndex(index));

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");

    for (let index = 0; index < files.length; index += 1) {
      const fetched = await fetchFile(files[index]);
      await ffmpeg.writeFile(inputNames[index], toUint8Array(fetched));
    }

    const listBody = buildConcatListContent(inputNames);
    await ffmpeg.writeFile(LIST_FILE_NAME, new TextEncoder().encode(listBody));

    try {
      await ffmpeg.exec(buildConcatMergeArgs(LIST_FILE_NAME, OUTPUT_FILE_NAME));
      const outputBytes = await ffmpeg.readFile(OUTPUT_FILE_NAME);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return new Blob([copy], { type: "audio/mpeg" });
    } finally {
      for (const name of inputNames) {
        await ffmpeg.deleteFile(name).catch(() => undefined);
      }
      await ffmpeg.deleteFile(LIST_FILE_NAME).catch(() => undefined);
      await ffmpeg.deleteFile(OUTPUT_FILE_NAME).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

export function mergedOutputFileName(files: File[]): string {
  if (files.length === 0) return "merged.mp3";
  const first = files[0].name.replace(/\.[^.]+$/, "") || "audio";
  return files.length === 1 ? `${first}.mp3` : `${first}-merged.mp3`;
}
