import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type JsonMinifyResult =
  | { ok: true; minified: string }
  | { ok: false; error: string };

export function minifyJson(input: string): JsonMinifyResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "JSON input is empty." };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return { ok: true, minified: JSON.stringify(parsed) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    return { ok: false, error: message };
  }
}
