import { downloadTextFile } from "@/lib/data-tool/converter";
import { parseCsvStringWithOptions } from "@/lib/data-tool/parser";
import type { DataRow } from "@/lib/data-tool/types";
import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export const CSV_TO_JSON_DEFAULT_FILENAME = "export.json";

export type CsvToJsonOptions = {
  useFirstRowAsHeaders: boolean;
};

export type CsvToJsonResult =
  | { ok: true; json: string; rowCount: number }
  | { ok: false; error: string };

function setNestedValue(obj: Record<string, unknown>, path: string, value: string): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const existing = current[key];
    if (existing === undefined || existing === null || typeof existing !== "object" || Array.isArray(existing)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

function rowToJsonObject(row: DataRow): Record<string, unknown> {
  const record: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (key.includes(".")) {
      setNestedValue(record, key, value);
    } else {
      record[key] = value;
    }
  }

  return record;
}

function rowsToJsonObjects(rows: DataRow[]): Record<string, unknown>[] {
  return rows.map((row) => rowToJsonObject(row));
}

export function convertCsvToJson(input: string, options: CsvToJsonOptions): CsvToJsonResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "CSV input is empty." };
  }

  try {
    const dataset = parseCsvStringWithOptions(trimmed, {
      useFirstRowAsHeaders: options.useFirstRowAsHeaders,
    });

    if (!dataset.rows.length) {
      return { ok: false, error: "CSV contains no data rows to convert." };
    }

    const objects = rowsToJsonObjects(dataset.rows);
    return {
      ok: true,
      json: JSON.stringify(objects, null, 2),
      rowCount: objects.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse CSV.";
    return { ok: false, error: message };
  }
}

export function downloadCsvToJson(json: string, fileName = CSV_TO_JSON_DEFAULT_FILENAME): void {
  downloadTextFile(json, fileName, "application/json;charset=utf-8");
}
