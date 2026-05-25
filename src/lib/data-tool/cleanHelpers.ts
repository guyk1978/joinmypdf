import type { DataRow } from "./types";

function rowSignature(row: DataRow, columns: string[]): string {
  return columns.map((col) => row[col] ?? "").join("\u0001");
}

/** Remove duplicate rows (exact match across all columns). */
export function removeDuplicates(rows: DataRow[], columns: string[]): DataRow[] {
  const seen = new Set<string>();
  const result: DataRow[] = [];

  for (const row of rows) {
    const key = rowSignature(row, columns);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }

  return result;
}

/** Trim leading/trailing whitespace on every cell. */
export function trimWhitespace(rows: DataRow[], columns: string[]): DataRow[] {
  return rows.map((row) => {
    const next: DataRow = { ...row };
    for (const col of columns) {
      next[col] = (next[col] ?? "").trim();
    }
    return next;
  });
}

const EMPTY_MARKERS = new Set(["", "null", "undefined", "n/a", "na", "-"]);

/** Replace empty or placeholder cells with a fill value. */
export function fillEmptyCells(
  rows: DataRow[],
  columns: string[],
  fillValue = "—",
): DataRow[] {
  return rows.map((row) => {
    const next: DataRow = { ...row };
    for (const col of columns) {
      const value = (next[col] ?? "").trim();
      if (EMPTY_MARKERS.has(value.toLowerCase())) next[col] = fillValue;
    }
    return next;
  });
}
