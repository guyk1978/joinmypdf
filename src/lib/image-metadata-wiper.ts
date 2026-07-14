/**
 * Local Image Metadata & Privacy Wiper.
 * Inspects EXIF/IPTC/XMP with exifr; strips JPEG via piexif and PNG via chunk filter.
 * Client-side only; no uploads. Pixel data is preserved for JPG/PNG strip paths.
 */

import exifr from "exifr";
import piexif from "piexifjs";
import { classifyPdfError, PdfProcessingError } from "@/lib/pdf-errors";
import { createImage, loadImageFileForCrop } from "@/lib/crop-image";

export type MetadataFindingId =
  | "gps"
  | "device"
  | "datetime"
  | "software"
  | "author"
  | "copyright"
  | "orientation"
  | "generic";

export type MetadataFinding = {
  id: MetadataFindingId;
  detail?: string;
};

export type InspectImageMetadataResult = {
  findings: MetadataFinding[];
  hasMetadata: boolean;
};

const ACCEPT_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/jpg",
]);

const ACCEPT_EXT = new Set(["jpg", "jpeg", "png"]);

export function isPrivacyWiperImageFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase() ?? "";
  if (ACCEPT_MIME.has(type)) return true;
  return ACCEPT_EXT.has(ext);
}

function isJpegFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  return type === "image/jpeg" || type === "image/jpg" || ext === "jpg" || ext === "jpeg";
}

function isPngFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  return type === "image/png" || ext === "png";
}

function bytesToBinary(bytes: Uint8Array): string {
  const parts: string[] = [];
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    parts.push(String.fromCharCode.apply(null, Array.from(slice) as number[]));
  }
  return parts.join("");
}

function binaryToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset]! << 24) |
      (bytes[offset + 1]! << 16) |
      (bytes[offset + 2]! << 8) |
      bytes[offset + 3]!) >>>
    0
  );
}

const PNG_STRIP_TYPES = new Set(["tEXt", "iTXt", "zTXt", "eXIf", "tIME"]);

/** Strip ancillary metadata chunks from PNG without touching IDAT pixels. */
export function stripPngMetadataChunks(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 8) return bytes;
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== signature[i]) return bytes;
  }

  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = readUint32BE(bytes, offset);
    const type = String.fromCharCode(
      bytes[offset + 4]!,
      bytes[offset + 5]!,
      bytes[offset + 6]!,
      bytes[offset + 7]!,
    );
    const chunkTotal = 12 + length;
    if (offset + chunkTotal > bytes.length) break;

    if (!PNG_STRIP_TYPES.has(type)) {
      parts.push(bytes.subarray(offset, offset + chunkTotal));
    }

    offset += chunkTotal;
    if (type === "IEND") break;
  }

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out;
}

function formatDetail(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value instanceof Date) return value.toISOString();
  const text = String(value).trim();
  return text || undefined;
}

/** Inspect an image for privacy-sensitive metadata findings. */
export async function inspectImageMetadata(file: File): Promise<InspectImageMetadataResult> {
  if (!isPrivacyWiperImageFile(file)) {
    throw new Error("Choose a JPG or PNG image.");
  }
  if (file.size === 0) {
    throw new Error(`"${file.name}" is empty. Choose another image.`);
  }

  try {
    const parsed = await exifr.parse(file, {
      gps: true,
      icc: false,
      iptc: true,
      xmp: true,
      reviveValues: true,
      translateKeys: true,
      translateValues: true,
      mergeOutput: true,
    });

    const findings: MetadataFinding[] = [];
    if (!parsed || typeof parsed !== "object") {
      return { findings, hasMetadata: false };
    }

    const lat = parsed.latitude ?? parsed.GPSLatitude;
    const lon = parsed.longitude ?? parsed.GPSLongitude;
    if (lat != null || lon != null || parsed.GPSLatitudeRef || parsed.GPSLongitudeRef) {
      const parts = [formatDetail(lat), formatDetail(lon)].filter(Boolean);
      findings.push({
        id: "gps",
        detail: parts.length ? parts.join(", ") : undefined,
      });
    }

    const device =
      formatDetail(parsed.Model) ||
      formatDetail(parsed.Make) ||
      formatDetail(parsed.LensModel);
    if (device || parsed.Make || parsed.Model) {
      const make = formatDetail(parsed.Make);
      const model = formatDetail(parsed.Model);
      findings.push({
        id: "device",
        detail: [make, model].filter(Boolean).join(" ") || device,
      });
    }

    const datetime =
      formatDetail(parsed.DateTimeOriginal) ||
      formatDetail(parsed.CreateDate) ||
      formatDetail(parsed.ModifyDate) ||
      formatDetail(parsed.DateTime);
    if (datetime) {
      findings.push({ id: "datetime", detail: datetime });
    }

    const software = formatDetail(parsed.Software) || formatDetail(parsed.CreatorTool);
    if (software) findings.push({ id: "software", detail: software });

    const author =
      formatDetail(parsed.Artist) ||
      formatDetail(parsed.Author) ||
      formatDetail(parsed.Creator);
    if (author) findings.push({ id: "author", detail: author });

    const copyright = formatDetail(parsed.Copyright) || formatDetail(parsed.Rights);
    if (copyright) findings.push({ id: "copyright", detail: copyright });

    if (parsed.Orientation != null && Number(parsed.Orientation) !== 1) {
      findings.push({ id: "orientation", detail: formatDetail(parsed.Orientation) });
    }

    const knownKeys = new Set([
      "latitude",
      "longitude",
      "GPSLatitude",
      "GPSLongitude",
      "GPSLatitudeRef",
      "GPSLongitudeRef",
      "Model",
      "Make",
      "LensModel",
      "DateTimeOriginal",
      "CreateDate",
      "ModifyDate",
      "DateTime",
      "Software",
      "CreatorTool",
      "Artist",
      "Author",
      "Creator",
      "Copyright",
      "Rights",
      "Orientation",
    ]);
    const extras = Object.keys(parsed).filter((key) => !knownKeys.has(key));
    if (findings.length === 0 && extras.length > 0) {
      findings.push({ id: "generic", detail: extras.slice(0, 6).join(", ") });
    } else if (extras.length > 8 && findings.length > 0) {
      findings.push({ id: "generic", detail: `${extras.length} additional tags` });
    }

    return { findings, hasMetadata: findings.length > 0 };
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

/**
 * Wipe EXIF/IPTC/XMP-style metadata while preserving pixel quality for JPG/PNG.
 * JPEG uses piexif.remove (no re-encode). PNG strips tEXt/iTXt/zTXt/eXIf/tIME chunks.
 */
export async function wipeImageMetadata(file: File): Promise<Blob> {
  if (!isPrivacyWiperImageFile(file)) {
    throw new Error("Choose a JPG or PNG image.");
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());

    if (isJpegFile(file)) {
      const stripped = piexif.remove(bytesToBinary(bytes));
      return new Blob([binaryToBytes(stripped) as BlobPart], { type: "image/jpeg" });
    }

    if (isPngFile(file)) {
      const stripped = stripPngMetadataChunks(bytes);
      return new Blob([stripped as BlobPart], { type: "image/png" });
    }

    // Fallback: canvas redraw (quality-neutral PNG path; JPEG at high quality).
    const imageSrc = await loadImageFileForCrop(file);
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");
      const width = Math.max(1, image.naturalWidth || image.width);
      const height = Math.max(1, image.naturalHeight || image.height);
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Failed to export clean image."))),
          "image/png",
        );
      });
    } finally {
      URL.revokeObjectURL(imageSrc);
    }
  } catch (error) {
    if (error instanceof PdfProcessingError) throw error;
    throw classifyPdfError(error);
  }
}

export function imageMetadataWiperOutputName(file: File): string {
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  const ext = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
  if (ext === "png") return `${slug}-privacy-clean.png`;
  return `${slug}-privacy-clean.jpg`;
}
