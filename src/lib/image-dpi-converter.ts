/**
 * Local Image DPI Converter — updates print density metadata without
 * re-encoding pixels. JPEG: EXIF + JFIF density. PNG: pHYs chunk.
 */

import exifr from "exifr";
import piexif from "piexifjs";

export const DPI_PRESETS = [72, 150, 300, 600] as const;
export const PRINT_READY_DPI = 300;
export const MIN_DPI = 1;
export const MAX_DPI = 9600;

export type ImageDpiFormat = "jpeg" | "png";

export type ImageDpiInfo = {
  format: ImageDpiFormat;
  width: number;
  height: number;
  /** Detected DPI when present; null if metadata lacks density. */
  dpi: number | null;
  /** True when X/Y differ slightly and we report a rounded average. */
  dpiApproximate: boolean;
};

export type ConvertImageDpiResult = {
  blob: Blob;
  fileName: string;
  dpi: number;
  width: number;
  height: number;
};

const ACCEPT_MIME = new Set(["image/jpeg", "image/jpg", "image/png"]);
const ACCEPT_EXT = new Set(["jpg", "jpeg", "png"]);

export function isDpiConverterImageFile(file: File): boolean {
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

function clampDpi(value: number): number {
  return Math.max(MIN_DPI, Math.min(MAX_DPI, Math.round(value)));
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

function writeUint32BE(target: Uint8Array, offset: number, value: number): void {
  target[offset] = (value >>> 24) & 0xff;
  target[offset + 1] = (value >>> 16) & 0xff;
  target[offset + 2] = (value >>> 8) & 0xff;
  target[offset + 3] = value & 0xff;
}

function writeUint16BE(target: Uint8Array, offset: number, value: number): void {
  target[offset] = (value >>> 8) & 0xff;
  target[offset + 1] = value & 0xff;
}

/** PNG CRC-32 (ISO 3309 / ITU-T V.42). */
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]!;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dpiToPixelsPerMeter(dpi: number): number {
  return Math.round(dpi / 0.0254);
}

function pixelsPerMeterToDpi(ppm: number): number {
  return Math.round(ppm * 0.0254);
}

function resolveDpiPair(x: number | null, y: number | null): { dpi: number | null; approximate: boolean } {
  if (x == null && y == null) return { dpi: null, approximate: false };
  if (x != null && y != null) {
    if (x === y) return { dpi: x, approximate: false };
    return { dpi: Math.round((x + y) / 2), approximate: true };
  }
  return { dpi: x ?? y, approximate: false };
}

function rationalToNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (Array.isArray(value) && value.length >= 2) {
    const num = Number(value[0]);
    const den = Number(value[1]);
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) return num / den;
  }
  return null;
}

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function readPngDpi(bytes: Uint8Array): number | null {
  if (bytes.length < 8) return null;
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== signature[i]) return null;
  }

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

    if (type === "pHYs" && length >= 9) {
      const dataOffset = offset + 8;
      const xPpm = readUint32BE(bytes, dataOffset);
      const yPpm = readUint32BE(bytes, dataOffset + 4);
      const unit = bytes[dataOffset + 8]!;
      if (unit === 1) {
        const { dpi } = resolveDpiPair(pixelsPerMeterToDpi(xPpm), pixelsPerMeterToDpi(yPpm));
        return dpi;
      }
      return null;
    }

    offset += chunkTotal;
    if (type === "IEND") break;
  }
  return null;
}

function buildPhysChunk(dpi: number): Uint8Array {
  const ppm = dpiToPixelsPerMeter(dpi);
  const data = new Uint8Array(9);
  writeUint32BE(data, 0, ppm);
  writeUint32BE(data, 4, ppm);
  data[8] = 1; // meter

  const typeAndData = new Uint8Array(4 + data.length);
  typeAndData.set([112, 72, 89, 115], 0); // pHYs
  typeAndData.set(data, 4);
  const crc = crc32(typeAndData);

  const chunk = new Uint8Array(12 + data.length);
  writeUint32BE(chunk, 0, data.length);
  chunk.set(typeAndData, 4);
  writeUint32BE(chunk, 8 + data.length, crc);
  return chunk;
}

/** Insert/replace PNG pHYs after IHDR without touching IDAT pixels. */
export function setPngDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (bytes.length < 8) throw new Error("Invalid PNG");
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== signature[i]) throw new Error("Invalid PNG");
  }

  const phys = buildPhysChunk(clampDpi(dpi));
  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  let inserted = false;

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

    if (type === "pHYs") {
      offset += chunkTotal;
      continue;
    }

    parts.push(bytes.subarray(offset, offset + chunkTotal));

    if (type === "IHDR" && !inserted) {
      parts.push(phys);
      inserted = true;
    }

    offset += chunkTotal;
    if (type === "IEND") break;
  }

  if (!inserted) throw new Error("PNG IHDR missing");

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out;
}

/** Patch JFIF APP0 density units in-place when present. */
function setJfifDensity(bytes: Uint8Array, dpi: number): Uint8Array {
  const target = clampDpi(dpi);
  // Soft-copy so we can mutate without touching the source ArrayBuffer view unexpectedly
  const out = new Uint8Array(bytes);

  let i = 0;
  if (out[0] !== 0xff || out[1] !== 0xd8) return out;
  i = 2;

  while (i + 4 < out.length) {
    if (out[i] !== 0xff) break;
    const marker = out[i + 1]!;
    if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS

    if (marker === 0xd8) {
      i += 2;
      continue;
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }

    const length = (out[i + 2]! << 8) | out[i + 3]!;
    if (length < 2 || i + 2 + length > out.length) break;

    if (marker === 0xe0 && length >= 16) {
      const id = String.fromCharCode(out[i + 4]!, out[i + 5]!, out[i + 6]!, out[i + 7]!, out[i + 8]!);
      if (id === "JFIF\0") {
        out[i + 11] = 1; // density unit: dpi
        writeUint16BE(out, i + 12, target);
        writeUint16BE(out, i + 14, target);
      }
    }

    i += 2 + length;
  }

  return out;
}

function emptyExifObject(): Record<string, unknown> {
  return { "0th": {}, Exif: {}, GPS: {}, "1st": {}, thumbnail: null };
}

function setJpegExifDpi(jpegBinary: string, dpi: number): string {
  const target = clampDpi(dpi);
  let exifObj: Record<string, unknown>;
  try {
    exifObj = piexif.load(jpegBinary) as Record<string, unknown>;
  } catch {
    exifObj = emptyExifObject();
  }

  const zeroth = {
    ...((exifObj["0th"] as Record<number | string, unknown>) ?? {}),
  };
  zeroth[piexif.ImageIFD.XResolution] = [target, 1];
  zeroth[piexif.ImageIFD.YResolution] = [target, 1];
  zeroth[piexif.ImageIFD.ResolutionUnit] = 2;

  const next = { ...exifObj, "0th": zeroth };
  const exifBytes = piexif.dump(next);
  return piexif.insert(exifBytes, jpegBinary);
}

async function readJpegDpi(file: File, bytes: Uint8Array): Promise<{ dpi: number | null; approximate: boolean }> {
  try {
    const parsed = await exifr.parse(file, {
      pick: ["XResolution", "YResolution", "ResolutionUnit", "JFIFDensity", "JFIFUnit"],
      translateKeys: false,
      reviveValues: true,
      mergeOutput: true,
    });

    if (parsed && typeof parsed === "object") {
      let x = rationalToNumber(parsed.XResolution);
      let y = rationalToNumber(parsed.YResolution);
      const unit = typeof parsed.ResolutionUnit === "number" ? parsed.ResolutionUnit : null;

      // ResolutionUnit 3 = cm → convert to inches
      if (unit === 3) {
        if (x != null) x = Math.round(x * 2.54);
        if (y != null) y = Math.round(y * 2.54);
      }

      const fromExif = resolveDpiPair(
        x != null ? Math.round(x) : null,
        y != null ? Math.round(y) : null,
      );
      if (fromExif.dpi != null) return fromExif;

      const jfif = rationalToNumber(parsed.JFIFDensity);
      if (jfif != null && jfif > 0) {
        const jfifUnit = typeof parsed.JFIFUnit === "number" ? parsed.JFIFUnit : 1;
        const dpi = jfifUnit === 2 ? Math.round(jfif * 2.54) : Math.round(jfif);
        return { dpi, approximate: false };
      }
    }
  } catch {
    // fall through to binary JFIF scan
  }

  // Fallback: scan JFIF APP0
  let i = 2;
  while (i + 16 < bytes.length) {
    if (bytes[i] !== 0xff) break;
    const marker = bytes[i + 1]!;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const length = (bytes[i + 2]! << 8) | bytes[i + 3]!;
    if (length < 2 || i + 2 + length > bytes.length) break;
    if (marker === 0xe0 && length >= 16) {
      const id = String.fromCharCode(
        bytes[i + 4]!,
        bytes[i + 5]!,
        bytes[i + 6]!,
        bytes[i + 7]!,
        bytes[i + 8]!,
      );
      if (id === "JFIF\0") {
        const unit = bytes[i + 11]!;
        const x = (bytes[i + 12]! << 8) | bytes[i + 13]!;
        const y = (bytes[i + 14]! << 8) | bytes[i + 15]!;
        if (unit === 1) return resolveDpiPair(x, y);
        if (unit === 2) {
          return resolveDpiPair(Math.round(x * 2.54), Math.round(y * 2.54));
        }
      }
    }
    i += 2 + length;
  }

  return { dpi: null, approximate: false };
}

/** Read current density metadata + pixel size (pixels unchanged by conversion). */
export async function readImageDpiInfo(file: File): Promise<ImageDpiInfo> {
  if (!isDpiConverterImageFile(file)) {
    throw new Error("Choose a JPG or PNG image.");
  }
  if (file.size === 0) {
    throw new Error(`"${file.name}" is empty.`);
  }

  const { width, height } = await readImageDimensions(file);
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (isPngFile(file)) {
    const dpi = readPngDpi(bytes);
    return { format: "png", width, height, dpi, dpiApproximate: false };
  }

  if (isJpegFile(file)) {
    const { dpi, approximate } = await readJpegDpi(file, bytes);
    return { format: "jpeg", width, height, dpi, dpiApproximate: approximate };
  }

  throw new Error("Unsupported format");
}

export function imageDpiOutputName(originalName: string, dpi: number): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  const safe = base.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 80);
  const ext = /\.png$/i.test(originalName) ? "png" : "jpg";
  return `${safe}-${dpi}dpi.${ext}`;
}

/**
 * Write target DPI into file headers only. Pixel width/height stay identical;
 * image payload is not re-compressed.
 */
export async function convertImageDpi(file: File, dpi: number): Promise<ConvertImageDpiResult> {
  if (!isDpiConverterImageFile(file)) {
    throw new Error("Choose a JPG or PNG image.");
  }
  const target = clampDpi(dpi);
  if (!Number.isFinite(target) || target < MIN_DPI) {
    throw new Error("Enter a valid DPI value.");
  }

  const info = await readImageDpiInfo(file);
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (info.format === "png") {
    const updated = setPngDpi(bytes, target);
    return {
      blob: new Blob([updated as BlobPart], { type: "image/png" }),
      fileName: imageDpiOutputName(file.name, target),
      dpi: target,
      width: info.width,
      height: info.height,
    };
  }

  const withJfif = setJfifDensity(bytes, target);
  const jpegBinary = setJpegExifDpi(bytesToBinary(withJfif), target);
  const outBytes = binaryToBytes(jpegBinary);

  return {
    blob: new Blob([outBytes as BlobPart], { type: "image/jpeg" }),
    fileName: imageDpiOutputName(file.name, target),
    dpi: target,
    width: info.width,
    height: info.height,
  };
}
