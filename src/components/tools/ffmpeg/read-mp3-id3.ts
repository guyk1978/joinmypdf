export type Mp3Id3Tags = {
  title: string;
  artist: string;
  album: string;
  year: string;
  coverMime?: string;
  coverData?: Uint8Array;
};

const EMPTY_TAGS: Mp3Id3Tags = {
  title: "",
  artist: "",
  album: "",
  year: "",
};

function readSyncsafeInt(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  );
}

function readInt32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  );
}

function decodeTextFrame(data: Uint8Array): string {
  if (data.length === 0) return "";

  const encoding = data[0];
  const textBytes = data.subarray(1);

  try {
    if (encoding === 0) {
      return new TextDecoder("latin1").decode(textBytes).replace(/\0/g, "").trim();
    }
    if (encoding === 1 || encoding === 2) {
      return new TextDecoder("utf-16").decode(textBytes).replace(/\0/g, "").trim();
    }
    return new TextDecoder("utf-8").decode(textBytes).replace(/\0/g, "").trim();
  } catch {
    return "";
  }
}

function readNullTerminatedLatin1(bytes: Uint8Array, start: number): { value: string; next: number } {
  let end = start;
  while (end < bytes.length && bytes[end] !== 0) end += 1;
  const value = new TextDecoder("latin1").decode(bytes.subarray(start, end));
  return { value, next: end + 1 };
}

function parseApicFrame(data: Uint8Array): { mime: string; image: Uint8Array } | null {
  if (data.length < 4) return null;

  let offset = 1;
  const mimeResult = readNullTerminatedLatin1(data, offset);
  offset = mimeResult.next + 1;
  const descResult = readNullTerminatedLatin1(data, offset);
  const image = data.subarray(descResult.next);

  if (image.byteLength === 0) return null;
  return { mime: mimeResult.value || "image/jpeg", image };
}

/**
 * Best-effort ID3v2 reader for common text tags and embedded cover art.
 * Returns empty strings when tags are missing — never throws for bare MP3 files.
 */
export async function readMp3Id3Tags(file: File): Promise<Mp3Id3Tags> {
  const head = await file.slice(0, Math.min(file.size, 1024 * 1024)).arrayBuffer();
  const bytes = new Uint8Array(head);

  if (bytes.length < 10 || bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return { ...EMPTY_TAGS };
  }

  const versionMajor = bytes[3];
  const tagSize = readSyncsafeInt(bytes, 6);
  let offset = 10;
  const end = Math.min(10 + tagSize, bytes.length);

  const tags: Mp3Id3Tags = { ...EMPTY_TAGS };

  while (offset + 10 <= end) {
    const frameId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    if (frameId === "\0\0\0\0" || frameId.trim() === "") break;

    const frameSize =
      versionMajor === 4 ? readSyncsafeInt(bytes, offset + 4) : readInt32BE(bytes, offset + 4);
    offset += 10;

    if (frameSize <= 0 || offset + frameSize > end) break;

    const frameData = bytes.subarray(offset, offset + frameSize);
    offset += frameSize;

    switch (frameId) {
      case "TIT2":
        tags.title = decodeTextFrame(frameData);
        break;
      case "TPE1":
        tags.artist = decodeTextFrame(frameData);
        break;
      case "TALB":
        tags.album = decodeTextFrame(frameData);
        break;
      case "TYER":
      case "TDRC":
        tags.year = decodeTextFrame(frameData).replace(/\D/g, "").slice(0, 4);
        break;
      case "APIC":
      case "PIC": {
        const apic = parseApicFrame(frameData);
        if (apic && !tags.coverData) {
          tags.coverMime = apic.mime;
          tags.coverData = apic.image;
        }
        break;
      }
      default:
        break;
    }
  }

  return tags;
}
