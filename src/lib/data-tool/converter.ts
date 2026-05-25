import type { DataRow } from "./types";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeXmlTag(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/^(\d)/, "_$1");
  return cleaned || "field";
}

export function rowsToCsv(rows: DataRow[], columns: string[]): string {
  const cols = columns.length ? columns : rows.length ? Object.keys(rows[0]) : [];
  const header = cols.map(escapeCsvCell).join(",");
  const body = rows.map((row) => cols.map((col) => escapeCsvCell(row[col] ?? "")).join(","));
  return [header, ...body].join("\n");
}

export function rowsToJson(rows: DataRow[], pretty = true): string {
  const payload = rows.map((row) => {
    const obj: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) obj[key] = value;
    return obj;
  });
  return JSON.stringify(payload, null, pretty ? 2 : 0);
}

export function rowsToXml(rows: DataRow[], columns: string[], rootTag = "dataset"): string {
  const cols = columns.length ? columns : rows.length ? Object.keys(rows[0]) : [];
  const rowNodes = rows
    .map((row) => {
      const fields = cols
        .map((col) => {
          const tag = sanitizeXmlTag(col);
          return `    <${tag}>${escapeXml(row[col] ?? "")}</${tag}>`;
        })
        .join("\n");
      return `  <row>\n${fields}\n  </row>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>\n${rowNodes}\n</${rootTag}>\n`;
}

export function downloadTextFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
