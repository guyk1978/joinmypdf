import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type JsonFormatResult =
  | { ok: true; formatted: string }
  | { ok: false; error: string };

export function formatJson(input: string): JsonFormatResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "JSON input is empty." };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return { ok: true, formatted: JSON.stringify(parsed, null, 2) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    return { ok: false, error: message };
  }
}

export type JsonTokenKind =
  | "plain"
  | "key"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "punctuation";

export type JsonToken = {
  kind: JsonTokenKind;
  text: string;
};

const JSON_TOKEN_PATTERN =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g;

export function tokenizeJsonLine(line: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = JSON_TOKEN_PATTERN.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: "plain", text: line.slice(lastIndex, match.index) });
    }

    const [full, quoted, colon] = match;

    if (quoted) {
      tokens.push({
        kind: colon ? "key" : "string",
        text: quoted,
      });
      if (colon) {
        tokens.push({ kind: "punctuation", text: colon });
      }
    } else if (full === "true" || full === "false") {
      tokens.push({ kind: "boolean", text: full });
    } else if (full === "null") {
      tokens.push({ kind: "null", text: full });
    } else if (/^-?\d/.test(full)) {
      tokens.push({ kind: "number", text: full });
    } else {
      tokens.push({ kind: "punctuation", text: full });
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < line.length) {
    tokens.push({ kind: "plain", text: line.slice(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ kind: "plain", text: line }];
}
