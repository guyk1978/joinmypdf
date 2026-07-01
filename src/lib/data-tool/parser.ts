import type { DataRow, ParsedDataset } from "./types";

function normalizeCell(value: string): string {
  return value.replace(/\r/g, "").trim();
}

/** Parse a single CSV line respecting quoted fields. */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      cells.push(normalizeCell(current));
      current = "";
      continue;
    }

    current += ch;
  }

  cells.push(normalizeCell(current));
  return cells;
}

function splitCsvRows(raw: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '""';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      current += ch;
      continue;
    }

    if ((ch === "\n" || (ch === "\r" && next !== "\n")) && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = "";
      if (ch === "\r" && next === "\n") i++;
      continue;
    }

    current += ch;
  }

  if (current.trim()) lines.push(current);
  return lines;
}

function rowFromCells(headers: string[], cells: string[]): DataRow | null {
  if (!cells.some((c) => c.length > 0)) return null;

  const row: DataRow = {};
  headers.forEach((header, index) => {
    row[header] = cells[index] ?? "";
  });
  return row;
}

function dedupeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((header, index) => {
    const base = header.trim() || `column_${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

/**
 * Parse raw CSV text into row objects. Drops malformed rows and normalizes headers.
 */
export function parseCsvString(raw: string): ParsedDataset {
  return parseCsvStringWithOptions(raw, { useFirstRowAsHeaders: true });
}

export type ParseCsvOptions = {
  useFirstRowAsHeaders?: boolean;
};

/**
 * Parse raw CSV text into row objects with optional header handling.
 */
export function parseCsvStringWithOptions(
  raw: string,
  options: ParseCsvOptions = {},
): ParsedDataset {
  const useFirstRowAsHeaders = options.useFirstRowAsHeaders !== false;
  const lines = splitCsvRows(raw.replace(/^\uFEFF/, ""));
  if (!lines.length) {
    return { rows: [], columns: [], sourceFormat: "csv" };
  }

  if (!useFirstRowAsHeaders) {
    const parsedLines = lines
      .map((line) => parseCsvLine(line))
      .filter((cells) => cells.some((cell) => cell.length > 0));

    if (!parsedLines.length) {
      return { rows: [], columns: [], sourceFormat: "csv" };
    }

    const columnCount = Math.max(...parsedLines.map((cells) => cells.length), 0);
    const columns = Array.from({ length: columnCount }, (_, index) => `column_${index + 1}`);
    const rows: DataRow[] = [];

    for (const cells of parsedLines) {
      while (cells.length < columns.length) cells.push("");
      const row = rowFromCells(columns, cells.slice(0, columns.length));
      if (row) rows.push(row);
    }

    return { rows, columns, sourceFormat: "csv" };
  }

  const headerCells = parseCsvLine(lines[0]);
  const columns = dedupeHeaders(headerCells);
  const rows: DataRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length === 1 && cells[0] === "") continue;

    while (cells.length < columns.length) cells.push("");
    const row = rowFromCells(columns, cells.slice(0, columns.length));
    if (row) rows.push(row);
  }

  return { rows, columns, sourceFormat: "csv" };
}

function flattenJsonValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function objectToRow(record: Record<string, unknown>): DataRow {
  const row: DataRow = {};
  for (const [key, value] of Object.entries(record)) {
    row[key] = flattenJsonValue(value);
  }
  return row;
}

function collectColumns(rows: DataRow[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) set.add(key);
  }
  return [...set];
}

/**
 * Parse JSON text into a uniform row array (array of objects or single object).
 */
export function parseJsonString(raw: string): ParsedDataset {
  const parsed: unknown = JSON.parse(raw);

  let rows: DataRow[] = [];

  if (Array.isArray(parsed)) {
    rows = parsed
      .filter((item) => item && typeof item === "object" && !Array.isArray(item))
      .map((item) => objectToRow(item as Record<string, unknown>));
  } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    rows = [objectToRow(parsed as Record<string, unknown>)];
  }

  const columns = collectColumns(rows);
  const normalized = rows.map((row) => {
    const next: DataRow = {};
    for (const col of columns) next[col] = row[col] ?? "";
    return next;
  });

  return { rows: normalized, columns, sourceFormat: "json" };
}

export function parseFileText(
  text: string,
  format: "csv" | "json",
  fileName?: string,
): ParsedDataset {
  const dataset = format === "csv" ? parseCsvString(text) : parseJsonString(text);
  return { ...dataset, fileName };
}
