/**
 * Persist homepage → tool-page file handoffs across client navigations.
 * File objects are serialized into sessionStorage (base64) so remounts still
 * recover the upload; cleared after a successful consume.
 */

export const PENDING_UPLOAD_STORAGE_KEY = "joinmypdf-pending-upload-v1";

/** Soft cap — sessionStorage is typically ~5MB; leave headroom for JSON wrapper. */
const MAX_TOTAL_BYTES = 4_000_000;
const MAX_AGE_MS = 15 * 60 * 1000;

type StoredFile = {
  name: string;
  type: string;
  lastModified: number;
  dataBase64: string;
};

export type PendingUploadPayload = {
  version: 1;
  toolSlug?: string;
  createdAt: number;
  files: StoredFile[];
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(dataBase64: string): Uint8Array {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function fileToStored(file: File): Promise<StoredFile> {
  const buffer = await file.arrayBuffer();
  return {
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
    dataBase64: bytesToBase64(new Uint8Array(buffer)),
  };
}

function storedToFile(stored: StoredFile): File {
  const bytes = base64ToBytes(stored.dataBase64);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return new File([buffer], stored.name, {
    type: stored.type,
    lastModified: stored.lastModified,
  });
}

export function clearPendingUploadStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_UPLOAD_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function readRawPayload(): PendingUploadPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_UPLOAD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingUploadPayload;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.files)) {
      clearPendingUploadStorage();
      return null;
    }
    if (Date.now() - parsed.createdAt > MAX_AGE_MS) {
      clearPendingUploadStorage();
      return null;
    }
    return parsed;
  } catch {
    clearPendingUploadStorage();
    return null;
  }
}

/** Reconstruct File objects from sessionStorage (sync). */
export function readPendingUploadFiles(toolSlug?: string): File[] | null {
  const payload = readRawPayload();
  if (!payload?.files.length) return null;
  if (toolSlug && payload.toolSlug && payload.toolSlug !== toolSlug) {
    return null;
  }
  try {
    return payload.files.map(storedToFile);
  } catch {
    clearPendingUploadStorage();
    return null;
  }
}

export function peekPendingUploadToolSlug(): string | undefined {
  return readRawPayload()?.toolSlug;
}

/**
 * Serialize files into sessionStorage. Throws on quota / oversized payloads
 * so callers can still fall back to in-memory handoff.
 */
export async function writePendingUploadFiles(
  files: File[],
  toolSlug?: string,
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!files.length) {
    clearPendingUploadStorage();
    return;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error("pending_upload_too_large");
  }

  const storedFiles = await Promise.all(files.map(fileToStored));
  const payload: PendingUploadPayload = {
    version: 1,
    toolSlug,
    createdAt: Date.now(),
    files: storedFiles,
  };

  window.sessionStorage.setItem(PENDING_UPLOAD_STORAGE_KEY, JSON.stringify(payload));
}
