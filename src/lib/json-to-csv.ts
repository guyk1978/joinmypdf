import { downloadTextFile, rowsToCsv } from "@/lib/data-tool/converter";
import type { DataRow } from "@/lib/data-tool/types";

export const JSON_TO_CSV_PREVIEW_ROW_LIMIT = 10;
export const JSON_TO_CSV_DEFAULT_FILENAME = "export.csv";

export type JsonToCsvResult =
  | { ok: true; headers: string[]; rows: DataRow[]; csv: string; totalRows: number }
  | { ok: false; error: string };

function cellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function flattenObject(obj: Record<string, unknown>, prefix = ""): DataRow {
  const result: DataRow = {};

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, path));
      continue;
    }

    result[path] = cellValue(value);
  }

  return result;
}

function normalizeToObjects(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return [];
    return parsed.map((item) => {
      if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        return item as Record<string, unknown>;
      }
      return { value: item };
    });
  }

  if (parsed !== null && typeof parsed === "object") {
    return [parsed as Record<string, unknown>];
  }

  return [{ value: parsed }];
}

function collectHeaders(rows: DataRow[]): string[] {
  const headers: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }

  return headers;
}

export function convertJsonToCsv(input: string): JsonToCsvResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "JSON input is empty." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    return { ok: false, error: message };
  }

  const objects = normalizeToObjects(parsed);
  if (objects.length === 0) {
    return { ok: false, error: "JSON must contain at least one record to convert." };
  }

  const rows = objects.map((item) => flattenObject(item));
  const headers = collectHeaders(rows);
  const csv = rowsToCsv(rows, headers);

  return {
    ok: true,
    headers,
    rows,
    csv,
    totalRows: rows.length,
  };
}

export function getJsonToCsvPreviewRows(rows: DataRow[], limit = JSON_TO_CSV_PREVIEW_ROW_LIMIT): DataRow[] {
  return rows.slice(0, limit);
}

export function downloadJsonToCsv(csv: string, fileName = JSON_TO_CSV_DEFAULT_FILENAME): void {
  downloadTextFile(csv, fileName, "text/csv;charset=utf-8");
}

/** Useful for compact preview cells in the table UI. */
export function formatPreviewCell(value: string, maxLength = 80): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}
