/**
 * Local JSON/CSV Data Beautifier & Explorer engine.
 * Client-side only — parse, search, filter, and export in the browser.
 */

import { parseCsvString } from "@/lib/data-tool/parser";
import { rowsToCsv, rowsToJson } from "@/lib/data-tool/converter";
import type { DataRow } from "@/lib/data-tool/types";

export type ExplorerFormat = "json" | "csv";

export type ParseExplorerResult =
  | {
      ok: true;
      format: "json";
      data: unknown;
      beautified: string;
      columns: string[];
    }
  | {
      ok: true;
      format: "csv";
      rows: DataRow[];
      columns: string[];
      beautified: string;
    }
  | { ok: false; code: "empty" | "invalid" };

export type JsonTreeNode = {
  id: string;
  path: string;
  keyLabel: string;
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  preview: string;
  depth: number;
  hasChildren: boolean;
  match: boolean;
};

function detectFormat(raw: string): ExplorerFormat | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  // Heuristic: CSV-looking if it has commas/newlines and fails as exclusive JSON start
  if (trimmed.includes(",") || trimmed.includes("\n") || trimmed.includes("\t")) return "csv";
  return "json";
}

function collectObjectKeys(value: unknown, limit = 200): string[] {
  const keys = new Set<string>();

  const walk = (node: unknown, depth: number) => {
    if (keys.size >= limit || depth > 4) return;
    if (Array.isArray(node)) {
      for (const item of node.slice(0, 50)) walk(item, depth + 1);
      return;
    }
    if (node && typeof node === "object") {
      for (const key of Object.keys(node as Record<string, unknown>)) {
        keys.add(key);
        if (keys.size >= limit) return;
      }
      for (const child of Object.values(node as Record<string, unknown>).slice(0, 30)) {
        walk(child, depth + 1);
      }
    }
  };

  walk(value, 0);
  return [...keys];
}

function previewValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") {
    const trimmed = value.length > 80 ? `${value.slice(0, 80)}…` : value;
    return JSON.stringify(trimmed);
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === "object") return `Object(${Object.keys(value as object).length})`;
  return String(value);
}

function valueType(value: unknown): JsonTreeNode["type"] {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "null";
}

function pathJoin(parent: string, key: string | number): string {
  if (typeof key === "number") {
    return parent ? `${parent}[${key}]` : `[${key}]`;
  }
  if (!parent) return key;
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return `${parent}.${key}`;
  return `${parent}[${JSON.stringify(key)}]`;
}

function matchesQuery(path: string, keyLabel: string, preview: string, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    path.toLowerCase().includes(q) ||
    keyLabel.toLowerCase().includes(q) ||
    preview.toLowerCase().includes(q)
  );
}

function nodeOrDescendantMatches(value: unknown, path: string, keyLabel: string, query: string): boolean {
  if (!query) return true;
  const preview = previewValue(value);
  if (matchesQuery(path, keyLabel, preview, query)) return true;

  if (Array.isArray(value)) {
    return value.some((item, index) =>
      nodeOrDescendantMatches(item, pathJoin(path, index), String(index), query),
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([key, child]) =>
      nodeOrDescendantMatches(child, pathJoin(path, key), key, query),
    );
  }
  return false;
}

/** Build visible (flattened) JSON tree rows for the current expand + search state. */
export function buildVisibleJsonTree(
  data: unknown,
  expanded: Set<string>,
  query: string,
): JsonTreeNode[] {
  const rows: JsonTreeNode[] = [];
  const MAX_NODES = 5000;

  const visit = (value: unknown, path: string, keyLabel: string, depth: number) => {
    if (rows.length >= MAX_NODES) return;

    const type = valueType(value);
    const preview = previewValue(value);
    const hasChildren = type === "object" || type === "array";
    const match = matchesQuery(path, keyLabel, preview, query);

    if (query && !nodeOrDescendantMatches(value, path, keyLabel, query)) {
      return;
    }

    rows.push({
      id: path || "$",
      path: path || "$",
      keyLabel,
      type,
      preview,
      depth,
      hasChildren,
      match,
    });

    if (!hasChildren) return;
    const isExpanded = query ? true : expanded.has(path || "$");
    if (!isExpanded) return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        visit(item, pathJoin(path, index), String(index), depth + 1);
      });
      return;
    }

    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      visit(child, pathJoin(path, key), key, depth + 1);
    });
  };

  visit(data, "", "root", 0);
  return rows;
}

/** Pick selected keys from objects (shallow on each object node in arrays). */
export function pickJsonKeys(data: unknown, selectedKeys: Set<string>): unknown {
  if (!selectedKeys.size) return data;

  const pickObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const next: Record<string, unknown> = {};
    for (const key of selectedKeys) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        next[key] = obj[key];
      }
    }
    return next;
  };

  if (Array.isArray(data)) {
    return data.map((item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? pickObject(item as Record<string, unknown>)
        : item,
    );
  }

  if (data && typeof data === "object") {
    return pickObject(data as Record<string, unknown>);
  }

  return data;
}

export function filterCsvRows(
  rows: DataRow[],
  columns: string[],
  query: string,
  sortColumn: string | null,
  sortDir: "asc" | "desc",
): DataRow[] {
  let next = rows;
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    next = next.filter((row) =>
      columns.some((col) => String(row[col] ?? "").toLowerCase().includes(q)),
    );
  }

  if (sortColumn) {
    next = [...next].sort((a, b) => {
      const av = a[sortColumn] ?? "";
      const bv = b[sortColumn] ?? "";
      const na = Number(av);
      const nb = Number(bv);
      const bothNumeric = av !== "" && bv !== "" && !Number.isNaN(na) && !Number.isNaN(nb);
      const cmp = bothNumeric ? na - nb : av.localeCompare(bv, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  return next;
}

export function exportExplorerData(args: {
  format: ExplorerFormat;
  jsonData?: unknown;
  csvRows?: DataRow[];
  selectedColumns: string[];
}): { content: string; fileName: string; mime: string } {
  const cols = args.selectedColumns;

  if (args.format === "csv") {
    const rows = (args.csvRows ?? []).map((row) => {
      const next: DataRow = {};
      for (const col of cols) next[col] = row[col] ?? "";
      return next;
    });
    return {
      content: rowsToCsv(rows, cols),
      fileName: "explored-data.csv",
      mime: "text/csv;charset=utf-8",
    };
  }

  const picked = pickJsonKeys(args.jsonData, new Set(cols));
  // If JSON looks like tabular rows, also offer CSV-friendly when all values are flat —
  // but default export remains pretty JSON.
  return {
    content: JSON.stringify(picked, null, 2),
    fileName: "explored-data.json",
    mime: "application/json;charset=utf-8",
  };
}

export function parseExplorerInput(raw: string, forced?: ExplorerFormat | "auto"): ParseExplorerResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, code: "empty" };

  const format =
    forced && forced !== "auto" ? forced : detectFormat(trimmed) ?? "json";

  try {
    if (format === "json") {
      const data = JSON.parse(trimmed) as unknown;
      const beautified = JSON.stringify(data, null, 2);
      const columns = collectObjectKeys(data);
      return { ok: true, format: "json", data, beautified, columns };
    }

    const dataset = parseCsvString(trimmed);
    if (!dataset.columns.length && !dataset.rows.length) {
      return { ok: false, code: "invalid" };
    }
    const beautified = rowsToJson(dataset.rows, true);
    return {
      ok: true,
      format: "csv",
      rows: dataset.rows,
      columns: dataset.columns,
      beautified,
    };
  } catch {
    // Fallback: if JSON forced failed, try CSV and vice versa when auto
    if (!forced || forced === "auto") {
      try {
        if (format === "json") {
          const dataset = parseCsvString(trimmed);
          if (dataset.columns.length) {
            return {
              ok: true,
              format: "csv",
              rows: dataset.rows,
              columns: dataset.columns,
              beautified: rowsToJson(dataset.rows, true),
            };
          }
        } else {
          const data = JSON.parse(trimmed) as unknown;
          return {
            ok: true,
            format: "json",
            data,
            beautified: JSON.stringify(data, null, 2),
            columns: collectObjectKeys(data),
          };
        }
      } catch {
        /* fall through */
      }
    }
    return { ok: false, code: "invalid" };
  }
}

export function downloadExplorerFile(content: string, fileName: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
