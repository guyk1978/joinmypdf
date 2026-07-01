import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type UrlCodecResult =
  | { ok: true; result: string }
  | { ok: false; error: string };

export function encodeUrlComponent(text: string): UrlCodecResult {
  if (!text) {
    return { ok: false, error: "Input is empty." };
  }

  try {
    return { ok: true, result: encodeURIComponent(text) };
  } catch {
    return { ok: false, error: "Could not encode the URL string." };
  }
}

export function decodeUrlComponent(encoded: string): UrlCodecResult {
  const trimmed = encoded.trim();
  if (!trimmed) {
    return { ok: false, error: "Input is empty." };
  }

  try {
    return { ok: true, result: decodeURIComponent(trimmed) };
  } catch {
    return { ok: false, error: "Invalid URL-encoded string." };
  }
}
