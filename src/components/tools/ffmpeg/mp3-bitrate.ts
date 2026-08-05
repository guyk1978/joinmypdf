/**
 * Lightweight MP3 bitrate helpers — frame header parse + size/duration estimate.
 */

const MPEG1_LAYER3_BITRATES = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
] as const;

const MPEG2_LAYER3_BITRATES = [
  0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160,
] as const;

function skipId3v2(bytes: Uint8Array): number {
  if (bytes.length < 10) return 0;
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return 0;
  const size =
    ((bytes[6] & 0x7f) << 21) |
    ((bytes[7] & 0x7f) << 14) |
    ((bytes[8] & 0x7f) << 7) |
    (bytes[9] & 0x7f);
  return Math.min(bytes.length, 10 + size);
}

function bitrateFromFrameHeader(b1: number, b2: number): number | null {
  const versionBits = (b1 >> 3) & 0x3;
  const layerBits = (b1 >> 1) & 0x3;
  const bitrateIndex = (b2 >> 4) & 0xf;

  // Only Layer III
  if (layerBits !== 0x1) return null;
  if (bitrateIndex === 0 || bitrateIndex === 0xf) return null;

  // MPEG-1
  if (versionBits === 0x3) {
    return MPEG1_LAYER3_BITRATES[bitrateIndex] ?? null;
  }
  // MPEG-2 / 2.5
  if (versionBits === 0x2 || versionBits === 0x0) {
    return MPEG2_LAYER3_BITRATES[bitrateIndex] ?? null;
  }
  return null;
}

/**
 * Sample bitrate from the first MPEG audio frames in an MP3 byte stream.
 * Returns the most common bitrate among sampled frames (CBR / average VBR).
 */
export function detectMp3BitrateFromBytes(bytes: Uint8Array, maxFrames = 24): number | null {
  let offset = skipId3v2(bytes);
  const counts = new Map<number, number>();
  let found = 0;

  while (offset < bytes.length - 3 && found < maxFrames) {
    if (bytes[offset] !== 0xff || (bytes[offset + 1] & 0xe0) !== 0xe0) {
      offset += 1;
      continue;
    }

    const bitrate = bitrateFromFrameHeader(bytes[offset + 1], bytes[offset + 2]);
    if (bitrate) {
      counts.set(bitrate, (counts.get(bitrate) ?? 0) + 1);
      found += 1;
    }

    // Advance roughly one frame (1152 samples @ 44.1k ≈ 26ms); use bitrate if known.
    const step =
      bitrate && bitrate > 0
        ? Math.max(24, Math.floor((144 * bitrate * 1000) / 44100))
        : 1;
    offset += step;
  }

  if (!counts.size) return null;

  let best: number | null = null;
  let bestCount = 0;
  for (const [bitrate, count] of counts) {
    if (count > bestCount) {
      best = bitrate;
      bestCount = count;
    }
  }
  return best;
}

/** Average bitrate from file size and duration (kbps). */
export function estimateBitrateFromSize(
  fileBytes: number,
  durationSeconds: number | null,
): number | null {
  if (!durationSeconds || durationSeconds <= 0 || fileBytes <= 0) return null;
  return Math.max(8, Math.round((fileBytes * 8) / durationSeconds / 1000));
}

/** Snap a raw kbps value to the nearest known MP3 CBR step (for display). */
export function snapBitrateKbps(rawKbps: number): number {
  const steps = [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  let best = steps[0];
  let bestDelta = Math.abs(rawKbps - best);
  for (const step of steps) {
    const delta = Math.abs(rawKbps - step);
    if (delta < bestDelta) {
      best = step;
      bestDelta = delta;
    }
  }
  return best;
}

/**
 * True if bytes look like a usable MP3 (ID3 tag and/or MPEG frame sync).
 */
export function isValidMp3ByteStream(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 128) return false;

  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return true;
  }

  const limit = Math.min(bytes.length - 1, 16_384);
  for (let i = 0; i < limit; i += 1) {
    if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0) {
      const bitrate = bitrateFromFrameHeader(bytes[i + 1], bytes[i + 2]);
      if (bitrate) return true;
    }
  }
  return false;
}

export function assertValidMp3Output(bytes: Uint8Array): void {
  if (!isValidMp3ByteStream(bytes)) {
    throw new Error(
      "Compression failed: the exported file is not a valid playable MP3. Please try again with a different bitrate.",
    );
  }
}
