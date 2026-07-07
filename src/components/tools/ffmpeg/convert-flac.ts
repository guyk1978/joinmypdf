import { fetchFile } from "@ffmpeg/util";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type FlacOutputFormat = "mp3" | "wav" | "aac";

export type FlacConvertOptions = {
  outputFormat: FlacOutputFormat;
  onPhase?: (phase: "loading" | "processing" | "validating") => void;
  onProgress?: (ratio: number) => void;
};

const FLAC_MAGIC = [0x66, 0x4c, 0x61, 0x43] as const;

const OUTPUT_CONFIG: Record<
  FlacOutputFormat,
  { extension: string; mimeType: string; label: string }
> = {
  mp3: { extension: "mp3", mimeType: "audio/mpeg", label: "MP3" },
  wav: { extension: "wav", mimeType: "audio/wav", label: "WAV" },
  aac: { extension: "m4a", mimeType: "audio/mp4", label: "AAC" },
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isFlacFile(file: File): boolean {
  if (file.type === "audio/flac" || file.type === "audio/x-flac") {
    return true;
  }
  return /\.flac$/i.test(file.name);
}

export async function validateFlacIntegrity(file: File): Promise<void> {
  if (!isFlacFile(file)) {
    throw new Error("Unsupported file type. Please upload a valid FLAC (.flac) audio file.");
  }

  if (file.size < 42) {
    throw new Error(
      `"${file.name}" is too small to be a valid FLAC file. The file may be empty or corrupted.`,
    );
  }

  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const hasMagic = FLAC_MAGIC.every((byte, index) => header[index] === byte);
  if (!hasMagic) {
    throw new Error(
      `"${file.name}" does not appear to be a valid FLAC file (missing fLaC header). The file may be corrupted or mislabeled.`,
    );
  }
}

/** FFmpeg args for FLAC → MP3 with highest VBR quality (libmp3lame -q:a 0). */
export function buildFlacToMp3Args(inputName: string, outputName: string): string[] {
  return ["-i", inputName, "-q:a", "0", outputName];
}

/** FFmpeg args for FLAC → uncompressed WAV (PCM). */
export function buildFlacToWavArgs(inputName: string, outputName: string): string[] {
  return ["-i", inputName, outputName];
}

/** FFmpeg args for FLAC → AAC in M4A container. */
export function buildFlacToAacArgs(inputName: string, outputName: string): string[] {
  return ["-i", inputName, "-c:a", "aac", "-b:a", "256k", outputName];
}

export function buildFlacConvertArgs(
  inputName: string,
  outputName: string,
  outputFormat: FlacOutputFormat,
): string[] {
  switch (outputFormat) {
    case "mp3":
      return buildFlacToMp3Args(inputName, outputName);
    case "wav":
      return buildFlacToWavArgs(inputName, outputName);
    case "aac":
      return buildFlacToAacArgs(inputName, outputName);
    default:
      throw new Error(`Unsupported output format "${outputFormat as string}". Choose MP3, WAV, or AAC.`);
  }
}

export function formatFlacConversionError(
  error: unknown,
  outputFormat: FlacOutputFormat,
): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  const label = OUTPUT_CONFIG[outputFormat].label;

  if (
    lower.includes("unknown encoder") ||
    (outputFormat === "aac" && lower.includes("aac") && lower.includes("not found"))
  ) {
    return `${label} export is not supported in this browser's FFmpeg build. Try MP3 or WAV output instead.`;
  }

  if (lower.includes("invalid data") || lower.includes("could not find codec")) {
    return `Could not decode "${label}" from this FLAC source. The file may be corrupted—re-export FLAC from your audio app and try again.`;
  }

  if (lower.includes("out of memory") || lower.includes("oom")) {
    return "The browser ran out of memory while transcoding. Close other tabs or try a shorter FLAC file.";
  }

  return raw || `FLAC to ${label} conversion failed.`;
}

/**
 * Local-first FLAC transcoding via ffmpeg.wasm in a dedicated worker.
 */
export async function convertFlacFile(
  file: File,
  options: FlacConvertOptions,
): Promise<Blob> {
  const { outputFormat } = options;
  const output = OUTPUT_CONFIG[outputFormat];

  options.onPhase?.("validating");
  await validateFlacIntegrity(file);

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = "input.flac";
  const outputName = `output.${output.extension}`;

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(buildFlacConvertArgs(inputName, outputName, outputFormat));
      const outputBytes = await ffmpeg.readFile(outputName);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return new Blob([copy], { type: output.mimeType });
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

export function flacOutputFileName(inputName: string, outputFormat: FlacOutputFormat): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}.${OUTPUT_CONFIG[outputFormat].extension}`;
}

export function flacOutputFormatLabel(outputFormat: FlacOutputFormat): string {
  return OUTPUT_CONFIG[outputFormat].label;
}
