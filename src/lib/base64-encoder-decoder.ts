import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

const BASE64_LINE_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

export type Base64TextResult =
  | { ok: true; result: string }
  | { ok: false; error: string };

export type Base64FileResult =
  | { ok: true; result: string; fileName: string }
  | { ok: false; error: string };

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function normalizeBase64Input(value: string): string {
  return value.trim().replace(/\s/g, "");
}

function isValidBase64(value: string): boolean {
  if (!value || value.length % 4 !== 0) return false;
  return BASE64_LINE_PATTERN.test(value);
}

export function encodeTextToBase64(text: string): Base64TextResult {
  if (!text) {
    return { ok: false, error: "Input is empty." };
  }

  try {
    const bytes = new TextEncoder().encode(text);
    return { ok: true, result: bytesToBase64(bytes) };
  } catch {
    return { ok: false, error: "Could not encode text to Base64." };
  }
}

export function decodeBase64ToText(base64: string): Base64TextResult {
  const normalized = normalizeBase64Input(base64);
  if (!normalized) {
    return { ok: false, error: "Input is empty." };
  }

  if (!isValidBase64(normalized)) {
    return { ok: false, error: "Invalid Base64 string." };
  }

  try {
    const bytes = base64ToBytes(normalized);
    return { ok: true, result: new TextDecoder().decode(bytes) };
  } catch {
    return { ok: false, error: "Invalid Base64 string." };
  }
}

export async function encodeFileToBase64(file: File): Promise<Base64FileResult> {
  if (!file.size) {
    return { ok: false, error: "The selected file is empty." };
  }

  try {
    const buffer = await file.arrayBuffer();
    const result = bytesToBase64(new Uint8Array(buffer));
    return { ok: true, result, fileName: file.name };
  } catch {
    return { ok: false, error: "Could not read the selected file." };
  }
}
