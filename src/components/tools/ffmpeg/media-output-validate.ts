import {
  assertValidMp3Output,
  isValidMp3ByteStream,
} from "@/components/tools/ffmpeg/mp3-bitrate";

/**
 * Shared output finalization checks for ffmpeg.wasm exports.
 * Prevents offering broken downloads (e.g. Windows Media 0xC00D36C4).
 */

export function assertNonEmptyOutput(bytes: Uint8Array, label = "output"): void {
  if (!bytes.byteLength) {
    throw new Error(`Processing failed: FFmpeg produced an empty ${label} file.`);
  }
  if (bytes.byteLength < 32) {
    throw new Error(`Processing failed: the ${label} file is too small to be valid.`);
  }
}

/** ISO BMFF / MP4 — looks for an `ftyp` box near the start. */
export function isValidMp4ByteStream(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 12) return false;
  const limit = Math.min(bytes.length - 8, 64);
  for (let i = 0; i <= limit; i += 1) {
    if (
      bytes[i + 4] === 0x66 &&
      bytes[i + 5] === 0x74 &&
      bytes[i + 6] === 0x79 &&
      bytes[i + 7] === 0x70
    ) {
      return true;
    }
  }
  return false;
}

export function assertValidMp4Output(bytes: Uint8Array): void {
  assertNonEmptyOutput(bytes, "MP4");
  if (!isValidMp4ByteStream(bytes)) {
    throw new Error(
      "Processing failed: the exported video is not a valid MP4. Please try again.",
    );
  }
}

export function isValidWavByteStream(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  );
}

export function assertValidWavOutput(bytes: Uint8Array): void {
  assertNonEmptyOutput(bytes, "WAV");
  if (!isValidWavByteStream(bytes)) {
    throw new Error(
      "Processing failed: the exported file is not a valid WAV. Please try again.",
    );
  }
}

export function isValidGifByteStream(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x39 || bytes[4] === 0x37) &&
    bytes[5] === 0x61
  );
}

export function assertValidGifOutput(bytes: Uint8Array): void {
  assertNonEmptyOutput(bytes, "GIF");
  if (!isValidGifByteStream(bytes)) {
    throw new Error(
      "Processing failed: the exported file is not a valid GIF. Please try again.",
    );
  }
}

export type MediaOutputKind = "mp3" | "mp4" | "wav" | "gif" | "webm" | "any";

export function assertValidMediaOutput(bytes: Uint8Array, kind: MediaOutputKind): void {
  switch (kind) {
    case "mp3":
      assertNonEmptyOutput(bytes, "MP3");
      assertValidMp3Output(bytes);
      return;
    case "mp4":
      assertValidMp4Output(bytes);
      return;
    case "wav":
      assertValidWavOutput(bytes);
      return;
    case "gif":
      assertValidGifOutput(bytes);
      return;
    case "webm":
      assertNonEmptyOutput(bytes, "WebM");
      // EBML header 0x1A45DFA3
      if (!(bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3)) {
        throw new Error(
          "Processing failed: the exported file is not a valid WebM. Please try again.",
        );
      }
      return;
    default:
      assertNonEmptyOutput(bytes);
  }
}

export function mediaKindFromFileName(fileName: string): MediaOutputKind {
  const ext = fileName.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  if (ext === "mp3") return "mp3";
  if (ext === "mp4" || ext === "m4v" || ext === "mov") return "mp4";
  if (ext === "wav") return "wav";
  if (ext === "gif") return "gif";
  if (ext === "webm") return "webm";
  return "any";
}

export function mediaKindFromMime(mimeType: string): MediaOutputKind {
  if (mimeType.includes("mpeg") || mimeType === "audio/mp3") return "mp3";
  if (mimeType.includes("mp4") || mimeType.includes("quicktime")) return "mp4";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("gif")) return "gif";
  if (mimeType.includes("webm")) return "webm";
  return "any";
}

/** Copy FFmpeg FS bytes, validate container, return a Blob. */
export function blobFromValidatedOutput(
  outputBytes: Uint8Array,
  mimeType: string,
  kind?: MediaOutputKind,
): Blob {
  const resolved = kind ?? mediaKindFromMime(mimeType);
  if (!outputBytes.byteLength) {
    throw new Error("Processing failed: FFmpeg produced an empty file.");
  }
  const copy = new Uint8Array(outputBytes.byteLength);
  copy.set(outputBytes);
  assertValidMediaOutput(copy, resolved);
  return new Blob([copy], { type: mimeType });
}

export { isValidMp3ByteStream, assertValidMp3Output };
