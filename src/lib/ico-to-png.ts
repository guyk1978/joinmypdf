import { canvasToPngBlob } from "@/lib/generate-favicon";

export { downloadBlob } from "@/lib/generate-favicon";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47] as const;
const ICO_TYPE = 1;

export type IcoFrame = {
  id: string;
  index: number;
  width: number;
  height: number;
  bitCount: number;
  previewUrl: string;
  pngBlob: Blob;
};

export function isAcceptedIcoFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/x-icon" || type === "image/vnd.microsoft.icon") return true;
  return /\.ico$/i.test(file.name);
}

export function icoToPngOutputName(sourceName: string, width: number, height: number): string {
  const base = sourceName.replace(/\.[^.]+$/, "") || "icon";
  return `${base}-${width}x${height}.png`;
}

function decodeIcoDimension(value: number): number {
  return value === 0 ? 256 : value;
}

function isPngData(data: Uint8Array): boolean {
  return PNG_SIGNATURE.every((byte, index) => data[index] === byte);
}

function xorBitmapByteLength(width: number, height: number, bitCount: number): number {
  if (bitCount === 32) return width * height * 4;
  if (bitCount === 24) return Math.ceil((width * 3) / 4) * 4 * height;
  if (bitCount === 8) return 256 * 4 + Math.ceil(width / 4) * 4 * height;
  if (bitCount === 4) return 16 * 4 + Math.ceil(Math.ceil(width / 2) / 4) * 4 * height;
  if (bitCount === 1) return 2 * 4 + Math.ceil(Math.ceil(width / 8) / 4) * 4 * height;
  throw new Error(`Unsupported ICO bit depth: ${bitCount}`);
}

function applyAndMask(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  dib: Uint8Array,
  andOffset: number,
): void {
  const andStride = Math.ceil(width / 32) * 4;
  for (let y = 0; y < height; y++) {
    const andRow = height - 1 - y;
    for (let x = 0; x < width; x++) {
      const byteIndex = andOffset + andRow * andStride + (x >> 3);
      const bit = 7 - (x & 7);
      if (((dib[byteIndex] ?? 0) >> bit) & 1) {
        pixels[(y * width + x) * 4 + 3] = 0;
      }
    }
  }
}

async function dibToPngBlob(dib: Uint8Array): Promise<Blob> {
  if (dib.byteLength < 40) {
    throw new Error("Invalid ICO bitmap data.");
  }

  const view = new DataView(dib.buffer, dib.byteOffset, dib.byteLength);
  const headerSize = view.getUint32(0, true);
  const width = view.getInt32(4, true);
  const biHeight = view.getInt32(8, true);
  const bitCount = view.getUint16(14, true);

  if (width <= 0 || biHeight <= 0) {
    throw new Error("Invalid ICO dimensions.");
  }

  const height = biHeight / 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not supported in this browser.");

  const imageData = ctx.createImageData(width, height);
  const pixels = imageData.data;

  if (bitCount === 32) {
    const rowSize = width * 4;
    for (let y = 0; y < height; y++) {
      const srcRow = height - 1 - y;
      for (let x = 0; x < width; x++) {
        const src = headerSize + srcRow * rowSize + x * 4;
        const dst = (y * width + x) * 4;
        pixels[dst] = dib[src + 2] ?? 0;
        pixels[dst + 1] = dib[src + 1] ?? 0;
        pixels[dst + 2] = dib[src] ?? 0;
        pixels[dst + 3] = dib[src + 3] ?? 255;
      }
    }
  } else if (bitCount === 24) {
    const rowSize = Math.ceil((width * 3) / 4) * 4;
    for (let y = 0; y < height; y++) {
      const srcRow = height - 1 - y;
      const rowStart = headerSize + srcRow * rowSize;
      for (let x = 0; x < width; x++) {
        const src = rowStart + x * 3;
        const dst = (y * width + x) * 4;
        pixels[dst] = dib[src + 2] ?? 0;
        pixels[dst + 1] = dib[src + 1] ?? 0;
        pixels[dst + 2] = dib[src] ?? 0;
        pixels[dst + 3] = 255;
      }
    }
  } else if (bitCount === 8) {
    const paletteStart = headerSize;
    const xorStart = headerSize + 256 * 4;
    const rowSize = Math.ceil(width / 4) * 4;
    for (let y = 0; y < height; y++) {
      const srcRow = height - 1 - y;
      const rowStart = xorStart + srcRow * rowSize;
      for (let x = 0; x < width; x++) {
        const paletteIndex = dib[rowStart + x] ?? 0;
        const paletteOffset = paletteStart + paletteIndex * 4;
        const dst = (y * width + x) * 4;
        pixels[dst] = dib[paletteOffset + 2] ?? 0;
        pixels[dst + 1] = dib[paletteOffset + 1] ?? 0;
        pixels[dst + 2] = dib[paletteOffset] ?? 0;
        pixels[dst + 3] = 255;
      }
    }
  } else {
    throw new Error(`Unsupported ICO bit depth: ${bitCount}`);
  }

  if (bitCount < 32) {
    const andOffset = headerSize + xorBitmapByteLength(width, height, bitCount);
    applyAndMask(pixels, width, height, dib, andOffset);
  } else {
    const andOffset = headerSize + width * height * 4;
    if (andOffset < dib.byteLength) {
      applyAndMask(pixels, width, height, dib, andOffset);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvasToPngBlob(canvas);
}

async function frameFromImageData(
  imageData: Uint8Array,
  index: number,
  width: number,
  height: number,
  bitCount: number,
): Promise<IcoFrame> {
  const pngBlob = isPngData(imageData)
    ? new Blob([imageData], { type: "image/png" })
    : await dibToPngBlob(imageData);

  const previewUrl = URL.createObjectURL(pngBlob);
  return {
    id: `frame-${index}-${width}x${height}`,
    index,
    width,
    height,
    bitCount,
    previewUrl,
    pngBlob,
  };
}

export async function parseIcoFile(file: File): Promise<IcoFrame[]> {
  if (!isAcceptedIcoFile(file)) {
    throw new Error("Invalid ICO file.");
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.byteLength < 6) {
    throw new Error("Invalid ICO file.");
  }

  const view = new DataView(buffer);
  const reserved = view.getUint16(0, true);
  const type = view.getUint16(2, true);
  const count = view.getUint16(4, true);

  if (reserved !== 0 || type !== ICO_TYPE || count === 0) {
    throw new Error("Invalid ICO file.");
  }

  const frames: IcoFrame[] = [];

  for (let index = 0; index < count; index++) {
    const entryOffset = 6 + index * 16;
    if (entryOffset + 16 > bytes.byteLength) break;

    const width = decodeIcoDimension(bytes[entryOffset] ?? 0);
    const height = decodeIcoDimension(bytes[entryOffset + 1] ?? 0);
    const bitCount = view.getUint16(entryOffset + 6, true);
    const bytesInRes = view.getUint32(entryOffset + 8, true);
    const imageOffset = view.getUint32(entryOffset + 12, true);

    if (!bytesInRes || imageOffset + bytesInRes > bytes.byteLength) {
      continue;
    }

    const imageData = bytes.subarray(imageOffset, imageOffset + bytesInRes);
    frames.push(await frameFromImageData(imageData, index, width, height, bitCount));
  }

  if (!frames.length) {
    throw new Error("No icons found in this ICO file.");
  }

  return frames.sort((a, b) => b.width * b.height - a.width * a.height);
}

export function revokeIcoFrames(frames: IcoFrame[]): void {
  for (const frame of frames) {
    URL.revokeObjectURL(frame.previewUrl);
  }
}
