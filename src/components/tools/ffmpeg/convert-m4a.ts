import { fetchFile } from "@ffmpeg/util";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type M4aOutputFormat = "mp3" | "wav";

export type M4aConvertOptions = {
  outputFormat: M4aOutputFormat;
  onPhase?: (phase: "loading" | "processing" | "validating") => void;
  onProgress?: (ratio: number) => void;
};

const OUTPUT_CONFIG: Record<
  M4aOutputFormat,
  { extension: string; mimeType: string; label: string }
> = {
  mp3: { extension: "mp3", mimeType: "audio/mpeg", label: "MP3" },
  wav: { extension: "wav", mimeType: "audio/wav", label: "WAV" },
};

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isM4aOrAacFile(file: File): boolean {
  if (
    file.type === "audio/mp4" ||
    file.type === "audio/m4a" ||
    file.type === "audio/aac" ||
    file.type === "audio/x-m4a"
  ) {
    return true;
  }
  return /\.(m4a|aac)$/i.test(file.name);
}

function inputExtension(file: File): "m4a" | "aac" {
  if (/\.aac$/i.test(file.name) || file.type === "audio/aac") {
    return "aac";
  }
  return "m4a";
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

function hasAdtsSync(header: Uint8Array): boolean {
  if (header.byteLength < 2) return false;
  return header[0] === 0xff && (header[1] & 0xf6) === 0xf0;
}

export async function validateM4aIntegrity(file: File): Promise<void> {
  if (!isM4aOrAacFile(file)) {
    throw new Error(
      "Unsupported file type. Please upload a valid M4A or AAC (.m4a, .aac) audio file.",
    );
  }

  if (file.size < 8) {
    throw new Error(
      `"${file.name}" is too small to be a valid M4A/AAC file. The file may be empty or corrupted.`,
    );
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!hasMp4FtypHeader(header) && !hasAdtsSync(header)) {
    throw new Error(
      `"${file.name}" does not appear to be a valid M4A/AAC file. The file may be corrupted, DRM-protected, or mislabeled.`,
    );
  }
}

/** FFmpeg args for M4A/AAC → MP3 with highest VBR quality (libmp3lame -q:a 0). */
export function buildM4aToMp3Args(inputName: string, outputName: string): string[] {
  return ["-i", inputName, "-q:a", "0", outputName];
}

/** FFmpeg args for M4A/AAC → uncompressed WAV (PCM). */
export function buildM4aToWavArgs(inputName: string, outputName: string): string[] {
  return ["-i", inputName, outputName];
}

export function buildM4aConvertArgs(
  inputName: string,
  outputName: string,
  outputFormat: M4aOutputFormat,
): string[] {
  switch (outputFormat) {
    case "mp3":
      return buildM4aToMp3Args(inputName, outputName);
    case "wav":
      return buildM4aToWavArgs(inputName, outputName);
    default:
      throw new Error(
        `Unsupported output format "${outputFormat as string}". Choose MP3 or WAV.`,
      );
  }
}

export function formatM4aConversionError(
  error: unknown,
  outputFormat: M4aOutputFormat,
): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  const label = OUTPUT_CONFIG[outputFormat].label;

  if (
    lower.includes("unknown encoder") ||
    lower.includes("codec not found") ||
    lower.includes("could not find codec")
  ) {
    return `This M4A/AAC track uses a codec that cannot be decoded in your browser's FFmpeg build. Try re-exporting from iTunes, GarageBand, or your DAW as standard AAC/M4A, or use the MP3 Converter for other sources.`;
  }

  if (lower.includes("invalid data") || lower.includes("error while decoding")) {
    return `Could not decode this M4A/AAC file for ${label} export. The file may be corrupted or DRM-protected—re-download or re-export and try again.`;
  }

  if (lower.includes("out of memory") || lower.includes("oom")) {
    return "The browser ran out of memory while converting. Close other tabs or try a shorter audio file.";
  }

  return raw || `M4A to ${label} conversion failed.`;
}

/**
 * Local-first M4A/AAC conversion via ffmpeg.wasm in a dedicated worker.
 */
export async function convertM4aFile(
  file: File,
  options: M4aConvertOptions,
): Promise<Blob> {
  const { outputFormat } = options;
  const output = OUTPUT_CONFIG[outputFormat];

  options.onPhase?.("validating");
  await validateM4aIntegrity(file);

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const ext = inputExtension(file);
  const inputName = `input.${ext}`;
  const outputName = `output.${output.extension}`;

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    try {
      await ffmpeg.exec(buildM4aConvertArgs(inputName, outputName, outputFormat));
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

export function m4aOutputFileName(inputName: string, outputFormat: M4aOutputFormat): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}.${OUTPUT_CONFIG[outputFormat].extension}`;
}

export function m4aOutputFormatLabel(outputFormat: M4aOutputFormat): string {
  return OUTPUT_CONFIG[outputFormat].label;
}
