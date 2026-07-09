import JSZip from "jszip";
import { classifyPdfError } from "./pdf-errors";
import {
  extractPageFragments,
  loadPdfDocument,
  type TextFragment,
} from "./pdf-text-extract";

const LINE_TOLERANCE = 4;
const COLUMN_GAP = 24;
const TABLE_ROW_GAP = 18;
const TABULAR_MIN_COLS = 2;
const TABULAR_MIN_ROWS = 2;

export type TableOutputFormat = "csv" | "xlsx";

export type ExtractTablesPdfProgress = {
  phase: "loading" | "parsing" | "building";
  currentPage: number;
  totalPages: number;
  tablesFound?: number;
};

type LineRow = {
  y: number;
  cells: { text: string; x: number }[];
};

export type ExtractedPdfTable = {
  id: string;
  pageStart: number;
  pageEnd: number;
  rows: string[][];
};

function buildLineRows(fragments: TextFragment[]): LineRow[] {
  if (!fragments.length) return [];

  const sorted = [...fragments].sort((a, b) => b.y - a.y || a.x - b.x);
  const lineGroups: { y: number; parts: TextFragment[] }[] = [];

  for (const frag of sorted) {
    const line = lineGroups.find((entry) => Math.abs(entry.y - frag.y) <= LINE_TOLERANCE);
    if (line) {
      line.parts.push(frag);
      line.y = (line.y + frag.y) / 2;
    } else {
      lineGroups.push({ y: frag.y, parts: [frag] });
    }
  }

  return lineGroups
    .sort((a, b) => b.y - a.y)
    .map((line) => {
      const parts = [...line.parts].sort((a, b) => a.x - b.x);
      const cells: { text: string; x: number }[] = [];
      if (!parts.length) return { y: line.y, cells };

      let bucket = parts[0].str;
      let bucketX = parts[0].x;
      let prevX = parts[0].x;

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (part.x - prevX > COLUMN_GAP) {
          if (bucket.trim()) cells.push({ text: bucket.trim(), x: bucketX });
          bucket = part.str;
          bucketX = part.x;
        } else {
          bucket = `${bucket} ${part.str}`.replace(/\s+/g, " ").trim();
        }
        prevX = part.x;
      }
      if (bucket.trim()) cells.push({ text: bucket.trim(), x: bucketX });
      return { y: line.y, cells };
    });
}

function isTabularLine(line: LineRow): boolean {
  return line.cells.filter((cell) => cell.text.length > 0).length >= TABULAR_MIN_COLS;
}

function columnCount(line: LineRow): number {
  return line.cells.length;
}

type TableBlock = {
  lines: LineRow[];
  pageNumber: number;
  tableIndex: number;
};

function detectTableBlocks(lineRows: LineRow[], pageNumber: number): TableBlock[] {
  const blocks: TableBlock[] = [];
  let current: LineRow[] = [];
  let prevY: number | null = null;
  let tableIndex = 0;

  const flush = () => {
    if (current.length >= TABULAR_MIN_ROWS) {
      tableIndex += 1;
      blocks.push({ lines: [...current], pageNumber, tableIndex });
    }
    current = [];
  };

  for (const line of lineRows) {
    if (!isTabularLine(line)) {
      flush();
      prevY = null;
      continue;
    }

    if (prevY !== null && Math.abs(prevY - line.y) > TABLE_ROW_GAP) {
      flush();
    }

    if (current.length > 0) {
      const prevCols = columnCount(current[current.length - 1]);
      const nextCols = columnCount(line);
      if (Math.abs(prevCols - nextCols) > 1) {
        flush();
      }
    }

    current.push(line);
    prevY = line.y;
  }

  flush();
  return blocks;
}

function alignBlockToGrid(block: TableBlock): string[][] {
  const maxCols = block.lines.reduce((max, line) => Math.max(max, line.cells.length), 0);
  if (maxCols === 0) return [];

  const colXs: number[][] = Array.from({ length: maxCols }, () => []);
  for (const line of block.lines) {
    line.cells.forEach((cell, index) => {
      colXs[index]?.push(cell.x);
    });
  }

  const anchors = colXs.map((xs) => {
    if (!xs.length) return 0;
    const sorted = [...xs].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  });

  return block.lines.map((line) => {
    const row = Array<string>(maxCols).fill("");
    for (const cell of line.cells) {
      let bestIndex = 0;
      let bestDistance = Infinity;
      for (let i = 0; i < anchors.length; i++) {
        const distance = Math.abs(cell.x - anchors[i]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = i;
        }
      }
      row[bestIndex] = row[bestIndex] ? `${row[bestIndex]} ${cell.text}`.trim() : cell.text;
    }
    return row;
  });
}

function rowsMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value.trim().toLowerCase() === b[index].trim().toLowerCase());
}

function mergeMultipageTables(tables: ExtractedPdfTable[]): ExtractedPdfTable[] {
  if (tables.length < 2) return tables;

  const merged: ExtractedPdfTable[] = [];
  for (const table of tables) {
    const prev = merged[merged.length - 1];
    const colCount = table.rows[0]?.length ?? 0;
    const prevColCount = prev?.rows[0]?.length ?? 0;

    if (
      prev &&
      table.pageStart === prev.pageEnd + 1 &&
      colCount >= TABULAR_MIN_COLS &&
      colCount === prevColCount
    ) {
      const duplicateHeader =
        table.rows.length > 1 && prev.rows.length > 0 && rowsMatch(table.rows[0], prev.rows[0]);
      prev.rows.push(...(duplicateHeader ? table.rows.slice(1) : table.rows));
      prev.pageEnd = table.pageEnd;
      continue;
    }

    merged.push({ ...table, rows: table.rows.map((row) => [...row]) });
  }

  return merged;
}

function gridToCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell ?? "";
          if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
          return value;
        })
        .join(","),
    )
    .join("\r\n");
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Table";
  let candidate = cleaned;
  let index = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` ${index}`;
    candidate = `${cleaned.slice(0, 31 - suffix.length)}${suffix}`;
    index += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function tableSheetName(table: ExtractedPdfTable, index: number): string {
  if (table.pageStart === table.pageEnd) {
    return `P${table.pageStart} T${index + 1}`;
  }
  return `P${table.pageStart}-${table.pageEnd}`;
}

async function buildXlsxBlob(tables: ExtractedPdfTable[]): Promise<Blob> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  tables.forEach((table, index) => {
    const sheet = XLSX.utils.aoa_to_sheet(table.rows);
    const sheetName = sanitizeSheetName(tableSheetName(table, index), usedSheetNames);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  });

  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function buildCsvBlob(tables: ExtractedPdfTable[]): Promise<Blob> {
  if (tables.length === 1) {
    return new Blob([gridToCsv(tables[0].rows)], { type: "text/csv;charset=utf-8" });
  }

  const zip = new JSZip();
  tables.forEach((table, index) => {
    const name =
      table.pageStart === table.pageEnd
        ? `page-${table.pageStart}-table-${index + 1}.csv`
        : `pages-${table.pageStart}-${table.pageEnd}-table-${index + 1}.csv`;
    zip.file(name, gridToCsv(table.rows));
  });

  return zip.generateAsync({ type: "blob", mimeType: "application/zip" });
}

export async function extractTablesFromPdf(
  file: File,
  format: TableOutputFormat,
  onProgress?: (progress: ExtractTablesPdfProgress) => void,
): Promise<Blob> {
  if (file.size === 0) {
    throw new Error("That file is empty. Choose another PDF.");
  }

  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });

  try {
    const doc = await loadPdfDocument(file);
    const totalPages = doc.numPages;
    const rawTables: ExtractedPdfTable[] = [];

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      onProgress?.({ phase: "parsing", currentPage: pageNumber, totalPages, tablesFound: rawTables.length });
      const page = await doc.getPage(pageNumber);
      const fragments = await extractPageFragments(page);
      const lineRows = buildLineRows(fragments);
      const blocks = detectTableBlocks(lineRows, pageNumber);

      for (const block of blocks) {
        const rows = alignBlockToGrid(block);
        if (rows.length >= TABULAR_MIN_ROWS) {
          rawTables.push({
            id: `p${pageNumber}-t${block.tableIndex}`,
            pageStart: pageNumber,
            pageEnd: pageNumber,
            rows,
          });
        }
      }
    }

    const tables = mergeMultipageTables(rawTables);

    if (tables.length === 0) {
      throw new Error(
        "No tables were detected. This PDF may use scanned images, free-form text, or layouts without clear column alignment—try PDF to Excel for a full-page grid export.",
      );
    }

    onProgress?.({
      phase: "building",
      currentPage: totalPages,
      totalPages,
      tablesFound: tables.length,
    });

    return format === "xlsx" ? buildXlsxBlob(tables) : buildCsvBlob(tables);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function extractTablesPdfOutputName(
  file: File,
  format: TableOutputFormat,
  multipleTables: boolean,
): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  if (format === "xlsx") return `joinmypdf-${slug}-tables.xlsx`;
  return multipleTables ? `joinmypdf-${slug}-tables.zip` : `joinmypdf-${slug}-table.csv`;
}
