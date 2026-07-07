import { fetchFile } from "@ffmpeg/util";
import { isMp3File } from "@/components/tools/ffmpeg/trim-mp3";
import { FfmpegWorkerClient } from "@/services/media/workers/FfmpegWorkerClient";

export type Mp3MetadataFields = {
  title: string;
  artist: string;
  album: string;
  year: string;
};

export type EditMp3MetadataOptions = {
  fields: Mp3MetadataFields;
  coverFile?: File | null;
  removeCover?: boolean;
  onPhase?: (phase: "loading" | "processing") => void;
  onProgress?: (ratio: number) => void;
};

const COVER_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

export function isCoverImageFile(file: File): boolean {
  if (COVER_MIME_TYPES.has(file.type)) return true;
  return /\.(jpe?g|png|webp)$/i.test(file.name);
}

export function coverInputName(file: File): string {
  if (file.type === "image/png" || /\.png$/i.test(file.name)) return "cover.png";
  if (file.type === "image/webp" || /\.webp$/i.test(file.name)) return "cover.webp";
  return "cover.jpg";
}

function metadataEntries(fields: Mp3MetadataFields): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  const title = fields.title.trim();
  const artist = fields.artist.trim();
  const album = fields.album.trim();
  const year = fields.year.trim();

  if (title) entries.push(["title", title]);
  if (artist) entries.push(["artist", artist]);
  if (album) entries.push(["album", album]);
  if (year) entries.push(["date", year]);

  return entries;
}

/** FFmpeg args for ID3 text tags with stream copy (user-specified command shape). */
export function buildMetadataOnlyArgs(
  inputName: string,
  outputName: string,
  fields: Mp3MetadataFields,
): string[] {
  const args = ["-i", inputName];

  for (const [key, value] of metadataEntries(fields)) {
    args.push("-metadata", `${key}=${value}`);
  }

  args.push("-c", "copy", outputName);
  return args;
}

/** FFmpeg args for replacing embedded album art (user-specified command shape). */
export function buildCoverOnlyArgs(
  inputName: string,
  coverName: string,
  outputName: string,
): string[] {
  return [
    "-i",
    inputName,
    "-i",
    coverName,
    "-map",
    "0:0",
    "-map",
    "1:0",
    "-c",
    "copy",
    "-disposition:v:0",
    "attached_pic",
    outputName,
  ];
}

export function buildEditMp3MetadataArgs(
  inputName: string,
  outputName: string,
  fields: Mp3MetadataFields,
  options: { coverName?: string; removeCover?: boolean },
): string[] {
  const entries = metadataEntries(fields);
  const hasCover = Boolean(options.coverName);
  const removeCover = Boolean(options.removeCover);

  if (!hasCover && !removeCover && entries.length > 0) {
    return buildMetadataOnlyArgs(inputName, outputName, fields);
  }

  if (hasCover && entries.length === 0) {
    return buildCoverOnlyArgs(inputName, options.coverName!, outputName);
  }

  const args = ["-i", inputName];

  if (hasCover) {
    args.push("-i", options.coverName!);
    args.push("-map", "0:a", "-map", "1:0");
  } else if (removeCover) {
    args.push("-map", "0:a");
  } else {
    args.push("-map", "0");
  }

  for (const [key, value] of entries) {
    args.push("-metadata", `${key}=${value}`);
  }

  args.push("-c", "copy");

  if (hasCover) {
    args.push("-disposition:v:0", "attached_pic");
  }

  args.push(outputName);
  return args;
}

export async function editMp3MetadataFile(
  file: File,
  options: EditMp3MetadataOptions,
): Promise<Blob> {
  if (!isMp3File(file)) {
    throw new Error(
      "Invalid or unsupported file. Please upload a valid MP3 audio file for metadata editing.",
    );
  }

  if (options.coverFile && !isCoverImageFile(options.coverFile)) {
    throw new Error(
      "Invalid cover image. Please upload a JPG, PNG, or WebP image for album art.",
    );
  }

  const entries = metadataEntries(options.fields);
  if (entries.length === 0 && !options.coverFile && !options.removeCover) {
    throw new Error("Add at least one metadata field, album art, or remove-cover option before saving.");
  }

  const ffmpeg = FfmpegWorkerClient.getInstance();
  const progressUnsub = options.onProgress ? ffmpeg.onProgress(options.onProgress) : undefined;

  const inputName = "input.mp3";
  const outputName = "output.mp3";
  const coverName = options.coverFile ? coverInputName(options.coverFile) : undefined;

  try {
    options.onPhase?.("loading");
    await ffmpeg.ensureLoaded();

    options.onPhase?.("processing");
    const fetched = await fetchFile(file);
    await ffmpeg.writeFile(inputName, toUint8Array(fetched));

    if (options.coverFile) {
      const coverBytes = await fetchFile(options.coverFile);
      await ffmpeg.writeFile(coverName!, toUint8Array(coverBytes));
    }

    try {
      await ffmpeg.exec(
        buildEditMp3MetadataArgs(inputName, outputName, options.fields, {
          coverName,
          removeCover: options.removeCover,
        }),
      );
      const outputBytes = await ffmpeg.readFile(outputName);
      const copy = new Uint8Array(outputBytes.byteLength);
      copy.set(outputBytes);
      return new Blob([copy], { type: "audio/mpeg" });
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => undefined);
      await ffmpeg.deleteFile(outputName).catch(() => undefined);
      if (coverName) await ffmpeg.deleteFile(coverName).catch(() => undefined);
      await ffmpeg.cleanupWorkspace();
    }
  } finally {
    progressUnsub?.();
  }
}

export function metadataOutputFileName(inputName: string): string {
  const base = inputName.replace(/\.[^.]+$/, "") || "audio";
  return `${base}-tagged.mp3`;
}
