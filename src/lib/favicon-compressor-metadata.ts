export type FaviconMetadataCategory =
  | "exif"
  | "icc-profile"
  | "xmp"
  | "photoshop"
  | "png-text"
  | "png-time"
  | "comment"
  | "thumbnail";

export type FaviconMetadataFinding = {
  id: FaviconMetadataCategory;
  bytes: number;
};

export type FaviconMetadataReport = {
  findings: FaviconMetadataFinding[];
  totalMetadataBytes: number;
  hasMetadata: boolean;
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

const METADATA_CATEGORY_ORDER: FaviconMetadataCategory[] = [
  "exif",
  "icc-profile",
  "xmp",
  "photoshop",
  "png-text",
  "png-time",
  "comment",
  "thumbnail",
];

type MetadataAccumulator = Map<FaviconMetadataCategory, number>;

function readUint32BE(data: Uint8Array, offset: number): number {
  return (
    ((data[offset] ?? 0) << 24) |
    ((data[offset + 1] ?? 0) << 16) |
    ((data[offset + 2] ?? 0) << 8) |
    (data[offset + 3] ?? 0)
  );
}

function createAccumulator(): MetadataAccumulator {
  return new Map();
}

function addBytes(
  accumulator: MetadataAccumulator,
  category: FaviconMetadataCategory,
  bytes: number,
): void {
  if (bytes <= 0) return;
  accumulator.set(category, (accumulator.get(category) ?? 0) + bytes);
}

function finalizeReport(accumulator: MetadataAccumulator): FaviconMetadataReport {
  const findings = METADATA_CATEGORY_ORDER.flatMap((id) => {
    const bytes = accumulator.get(id);
    if (!bytes) return [];
    return [{ id, bytes }];
  });

  const totalMetadataBytes = findings.reduce((sum, finding) => sum + finding.bytes, 0);

  return {
    findings,
    totalMetadataBytes,
    hasMetadata: findings.length > 0,
  };
}

function isPngData(data: Uint8Array): boolean {
  if (data.length < PNG_SIGNATURE.length) return false;
  return PNG_SIGNATURE.every((byte, index) => data[index] === byte);
}

function bytesStartWith(data: Uint8Array, text: string): boolean {
  if (data.length < text.length) return false;
  for (let i = 0; i < text.length; i += 1) {
    if (data[i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

function payloadHasEmbeddedJpeg(payload: Uint8Array, startAt = 0): boolean {
  for (let index = startAt; index < payload.length - 1; index += 1) {
    if (payload[index] === 0xff && payload[index + 1] === 0xd8) return true;
  }
  return false;
}

function scanPngMetadata(data: Uint8Array, accumulator: MetadataAccumulator): void {
  if (!isPngData(data)) return;

  let offset = PNG_SIGNATURE.length;
  while (offset + 12 <= data.length) {
    const length = readUint32BE(data, offset);
    const type = String.fromCharCode(
      data[offset + 4] ?? 0,
      data[offset + 5] ?? 0,
      data[offset + 6] ?? 0,
      data[offset + 7] ?? 0,
    );
    const chunkBytes = 12 + length;

    switch (type) {
      case "eXIf":
        addBytes(accumulator, "exif", chunkBytes);
        break;
      case "iCCP":
        addBytes(accumulator, "icc-profile", chunkBytes);
        break;
      case "tIME":
        addBytes(accumulator, "png-time", chunkBytes);
        break;
      case "tEXt":
      case "zTXt":
      case "iTXt":
        addBytes(accumulator, "png-text", chunkBytes);
        break;
      default:
        break;
    }

    offset += chunkBytes;
    if (type === "IEND") break;
  }
}

function scanJpegMetadata(data: Uint8Array, accumulator: MetadataAccumulator): void {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return;

  let offset = 2;
  while (offset + 4 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = data[offset + 1] ?? 0;
    if (marker === 0xd9) break;
    if (marker === 0xda) break;

    const segmentLength = ((data[offset + 2] ?? 0) << 8) | (data[offset + 3] ?? 0);
    if (segmentLength < 2) break;

    const segmentEnd = offset + 2 + segmentLength;
    if (segmentEnd > data.length) break;

    const payload = data.subarray(offset + 4, segmentEnd);
    const segmentBytes = segmentLength + 2;

    if (marker === 0xe1) {
      if (bytesStartWith(payload, "Exif\0\0")) {
        addBytes(accumulator, "exif", segmentBytes);
        if (payloadHasEmbeddedJpeg(payload, 6)) {
          addBytes(accumulator, "thumbnail", segmentBytes);
        }
      } else if (
        bytesStartWith(payload, "http://ns.adobe.com/xap/1.0/\0") ||
        bytesStartWith(payload, "http://ns.adobe.com/xap/1.0/") ||
        bytesStartWith(payload, "<?xpacket")
      ) {
        addBytes(accumulator, "xmp", segmentBytes);
      }
    } else if (marker === 0xe2 && bytesStartWith(payload, "ICC_PROFILE")) {
      addBytes(accumulator, "icc-profile", segmentBytes);
    } else if (marker === 0xed && bytesStartWith(payload, "Photoshop 3.0")) {
      addBytes(accumulator, "photoshop", segmentBytes);
    } else if (marker === 0xfe) {
      addBytes(accumulator, "comment", segmentBytes);
    }

    offset = segmentEnd;
  }
}

function scanIcoMetadata(data: Uint8Array, accumulator: MetadataAccumulator): void {
  if (data.length < 6) return;

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const reserved = view.getUint16(0, true);
  const type = view.getUint16(2, true);
  const count = view.getUint16(4, true);

  if (reserved !== 0 || type !== 1 || count === 0) return;

  let directoryOffset = 6;
  for (let index = 0; index < count; index += 1) {
    if (directoryOffset + 16 > data.length) break;

    const imageOffset = view.getUint32(directoryOffset + 12, true);
    const imageSize = view.getUint32(directoryOffset + 8, true);
    directoryOffset += 16;

    if (!imageSize || imageOffset + imageSize > data.length) continue;

    const imageData = data.subarray(imageOffset, imageOffset + imageSize);
    if (isPngData(imageData)) {
      scanPngMetadata(imageData, accumulator);
    }
  }
}

export async function analyzeFaviconMetadata(file: File): Promise<FaviconMetadataReport> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  const accumulator = createAccumulator();

  if (isPngData(data)) {
    scanPngMetadata(data, accumulator);
  } else if (data.length >= 2 && data[0] === 0xff && data[1] === 0xd8) {
    scanJpegMetadata(data, accumulator);
  } else {
    scanIcoMetadata(data, accumulator);
  }

  return finalizeReport(accumulator);
}
