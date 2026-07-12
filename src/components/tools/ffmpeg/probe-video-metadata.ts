/**
 * Lightweight ISO BMFF / QuickTime metadata scan for privacy preview.
 * Reads common tags (creation time, make/model, GPS) without ffmpeg.
 */

export type VideoMetadataField = {
  key: string;
  label: string;
  value: string;
  sensitive?: boolean;
};

export type VideoMetadataPreview = {
  fields: VideoMetadataField[];
  hasGps: boolean;
  hasDeviceInfo: boolean;
  hasTimestamps: boolean;
  scannedBytes: number;
};

const QT_EPOCH_OFFSET_SEC = 2082844800; // 1904-01-01 → 1970-01-01

function readFourCc(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  let out = "";
  const end = Math.min(bytes.length, start + length);
  for (let i = start; i < end; i++) {
    const c = bytes[i];
    if (c === 0) break;
    if (c >= 32 && c < 127) out += String.fromCharCode(c);
  }
  return out.trim();
}

function readUtf8(bytes: Uint8Array, start: number, length: number): string {
  try {
    return new TextDecoder("utf-8", { fatal: false })
      .decode(bytes.subarray(start, start + length))
      .replace(/\0/g, "")
      .trim();
  } catch {
    return readAscii(bytes, start, length);
  }
}

function qtTimeToIso(seconds: number): string | null {
  if (!seconds || seconds === 0) return null;
  const ms = (seconds - QT_EPOCH_OFFSET_SEC) * 1000;
  if (!Number.isFinite(ms)) return null;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  // Guard absurd dates
  if (date.getUTCFullYear() < 1970 || date.getUTCFullYear() > 2100) return null;
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function parseIso6709(value: string): string | null {
  const match = value.match(/([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)(?:([+-]\d+(?:\.\d+)?))?/);
  if (!match) return value || null;
  const lat = match[1];
  const lon = match[2];
  const alt = match[3];
  return alt ? `${lat}, ${lon} (alt ${alt})` : `${lat}, ${lon}`;
}

type Box = { type: string; start: number; end: number; headerSize: number };

function iterateBoxes(
  bytes: Uint8Array,
  start: number,
  end: number,
  visit: (box: Box) => void | false,
): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = start;

  while (offset + 8 <= end) {
    let size = view.getUint32(offset);
    const type = readFourCc(view, offset + 4);
    let headerSize = 8;

    if (size === 1) {
      if (offset + 16 > end) break;
      const high = view.getUint32(offset + 8);
      const low = view.getUint32(offset + 12);
      size = high * 2 ** 32 + low;
      headerSize = 16;
    } else if (size === 0) {
      size = end - offset;
    }

    if (size < headerSize || offset + size > end) break;

    const box: Box = { type, start: offset, end: offset + size, headerSize };
    if (visit(box) === false) return;
    offset += size;
  }
}

function containerTypes(type: string): boolean {
  return (
    type === "moov" ||
    type === "udta" ||
    type === "meta" ||
    type === "ilst" ||
    type === "----" ||
    type === "traf" ||
    type === "trak" ||
    type === "mdia" ||
    type === "minf" ||
    type === "stbl"
  );
}

function parseMvhd(bytes: Uint8Array, box: Box, fields: Map<string, VideoMetadataField>): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dataStart = box.start + box.headerSize;
  if (dataStart + 20 > box.end) return;
  const version = view.getUint8(dataStart);
  let creation: number;
  let modification: number;
  if (version === 1) {
    if (dataStart + 28 > box.end) return;
    creation = Number(view.getBigUint64(dataStart + 4));
    modification = Number(view.getBigUint64(dataStart + 12));
  } else {
    creation = view.getUint32(dataStart + 4);
    modification = view.getUint32(dataStart + 8);
  }
  const created = qtTimeToIso(creation);
  const modified = qtTimeToIso(modification);
  if (created) {
    fields.set("creation_time", {
      key: "creation_time",
      label: "Capture / creation time",
      value: created,
      sensitive: true,
    });
  }
  if (modified && modified !== created) {
    fields.set("modification_time", {
      key: "modification_time",
      label: "Modification time",
      value: modified,
      sensitive: true,
    });
  }
}

function parseIlstData(
  bytes: Uint8Array,
  box: Box,
): string | null {
  // ilst entry → data box: version/flags (4) + type (4) + locale (4) + payload
  let found: string | null = null;
  iterateBoxes(bytes, box.start + box.headerSize, box.end, (child) => {
    if (child.type !== "data") return;
    const payloadStart = child.start + child.headerSize + 8;
    if (payloadStart >= child.end) return;
    const text = readUtf8(bytes, payloadStart, child.end - payloadStart);
    if (text) found = text;
    return false;
  });
  return found;
}

const ILST_LABELS: Record<string, { label: string; sensitive?: boolean }> = {
  "©mak": { label: "Device make", sensitive: true },
  "©mod": { label: "Device model", sensitive: true },
  "©xyz": { label: "GPS location", sensitive: true },
  "©day": { label: "Date", sensitive: true },
  "©too": { label: "Encoder / software" },
  "©cmt": { label: "Comment" },
  "©nam": { label: "Title" },
  "©ART": { label: "Artist" },
  "©alb": { label: "Album" },
  "©swr": { label: "Software" },
  "©fmt": { label: "Format" },
  "©cpy": { label: "Copyright" },
};

function ingestTag(
  fields: Map<string, VideoMetadataField>,
  key: string,
  label: string,
  raw: string,
  sensitive?: boolean,
): void {
  let value = raw.trim();
  if (!value) return;
  if (key.includes("xyz") || /location|gps|iso6709/i.test(key + label)) {
    value = parseIso6709(value) ?? value;
    sensitive = true;
  }
  fields.set(key, { key, label, value, sensitive });
}

function walk(
  bytes: Uint8Array,
  start: number,
  end: number,
  fields: Map<string, VideoMetadataField>,
  freeform: { mean?: string; name?: string },
): void {
  iterateBoxes(bytes, start, end, (box) => {
    if (box.type === "mvhd") {
      parseMvhd(bytes, box, fields);
      return;
    }

    if (box.type === "hdlr") {
      // skip
      return;
    }

    // Classic ilst fourcc tags (©mak, ©mod, …)
    if (ILST_LABELS[box.type] || box.type.startsWith("©")) {
      const meta = ILST_LABELS[box.type] ?? {
        label: box.type,
        sensitive: true,
      };
      const value = parseIlstData(bytes, box);
      if (value) ingestTag(fields, box.type, meta.label, value, meta.sensitive);
      return;
    }

    if (box.type === "mean") {
      freeform.mean = readUtf8(bytes, box.start + box.headerSize + 4, box.end - box.start - box.headerSize - 4);
      return;
    }

    if (box.type === "name") {
      freeform.name = readUtf8(bytes, box.start + box.headerSize + 4, box.end - box.start - box.headerSize - 4);
      return;
    }

    if (box.type === "data" && freeform.name) {
      const payloadStart = box.start + box.headerSize + 8;
      if (payloadStart < box.end) {
        const value = readUtf8(bytes, payloadStart, box.end - payloadStart);
        const key = freeform.name;
        const lower = key.toLowerCase();
        const label = key
          .replace(/^com\.apple\.quicktime\./i, "")
          .replace(/[._]/g, " ");
        const sensitive =
          /location|gps|latitude|longitude|make|model|creation|date|time|user|artist/i.test(lower);
        if (value) ingestTag(fields, key, label, value, sensitive);
      }
      freeform.mean = undefined;
      freeform.name = undefined;
      return;
    }

    if (containerTypes(box.type) || box.type === "----") {
      const nextStart =
        box.type === "meta" ? box.start + box.headerSize + 4 : box.start + box.headerSize;
      if (nextStart < box.end) {
        walk(bytes, nextStart, box.end, fields, box.type === "----" ? {} : freeform);
      }
    }
  });
}

/** Scan the start of an MP4/MOV file for privacy-relevant metadata. */
export async function probeVideoContainerMetadata(file: File): Promise<VideoMetadataPreview> {
  // Metadata lives in moov; for faststart it's near the start. Read up to 8MB or whole file.
  const maxBytes = Math.min(file.size, 8 * 1024 * 1024);
  const buffer = await file.slice(0, maxBytes).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const fields = new Map<string, VideoMetadataField>();

  walk(bytes, 0, bytes.length, fields, {});

  // If moov was at the end (non-faststart), try the last 2MB as well.
  if (fields.size === 0 && file.size > maxBytes) {
    const tailSize = Math.min(file.size, 2 * 1024 * 1024);
    const tail = new Uint8Array(await file.slice(file.size - tailSize).arrayBuffer());
    walk(tail, 0, tail.length, fields, {});
  }

  const list = [...fields.values()].sort((a, b) => {
    const rank = (f: VideoMetadataField) => (f.sensitive ? 0 : 1);
    return rank(a) - rank(b) || a.label.localeCompare(b.label);
  });

  return {
    fields: list,
    hasGps: list.some((f) => f.sensitive && /gps|location/i.test(f.key + f.label)),
    hasDeviceInfo: list.some((f) => /make|model|device/i.test(f.key + f.label)),
    hasTimestamps: list.some((f) => /time|date|day/i.test(f.key + f.label)),
    scannedBytes: maxBytes,
  };
}
