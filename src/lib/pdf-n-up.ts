import { PDFDocument, rgb, type PDFEmbeddedPage, type PDFPage } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "./pdf-errors";

export type NUpPreset = "2-up" | "4-up" | "6-up" | "9-up" | "custom";

export type NUpGrid = {
  cols: number;
  rows: number;
};

export type NUpOptions = {
  preset: NUpPreset;
  customCols?: number;
  customRows?: number;
  password?: string;
};

export type NUpProgress = {
  phase: "loading" | "arranging" | "finalizing";
  currentSheet: number;
  totalSheets: number;
};

export const N_UP_PRESET_GRIDS: Record<Exclude<NUpPreset, "custom">, NUpGrid> = {
  "2-up": { cols: 2, rows: 1 },
  "4-up": { cols: 2, rows: 2 },
  "6-up": { cols: 3, rows: 2 },
  "9-up": { cols: 3, rows: 3 },
};

export function resolveNUpGrid(options: NUpOptions): NUpGrid {
  if (options.preset !== "custom") {
    return N_UP_PRESET_GRIDS[options.preset];
  }
  const cols = Math.min(4, Math.max(1, Math.round(options.customCols ?? 2)));
  const rows = Math.min(4, Math.max(1, Math.round(options.customRows ?? 2)));
  return { cols, rows };
}

export function nUpPagesPerSheet(grid: NUpGrid): number {
  return grid.cols * grid.rows;
}

export function nUpOutputSheetCount(sourcePageCount: number, grid: NUpGrid): number {
  if (sourcePageCount <= 0) return 0;
  return Math.ceil(sourcePageCount / nUpPagesPerSheet(grid));
}

function fitInBox(
  srcW: number,
  srcH: number,
  boxW: number,
  boxH: number,
): { x: number; y: number; width: number; height: number } {
  const scale = Math.min(boxW / srcW, boxH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return {
    x: (boxW - width) / 2,
    y: (boxH - height) / 2,
    width,
    height,
  };
}

async function loadDocument(source: Uint8Array, password?: string): Promise<PDFDocument> {
  const loadOptions = password?.trim() ? { password: password.trim() } : {};
  try {
    return await PDFDocument.load(source, loadOptions);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

function drawBlankCell(page: PDFPage, x: number, y: number, cellW: number, cellH: number) {
  page.drawRectangle({
    x: x + 4,
    y: y + 4,
    width: cellW - 8,
    height: cellH - 8,
    borderWidth: 0.5,
    borderColor: rgb(0.82, 0.82, 0.85),
    color: rgb(0.98, 0.98, 0.99),
  });
}

function drawEmbeddedInCell(
  page: PDFPage,
  embedded: PDFEmbeddedPage,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
) {
  const fit = fitInBox(embedded.width, embedded.height, cellW, cellH);
  page.drawPage(embedded, {
    x: cellX + fit.x,
    y: cellY + fit.y,
    width: fit.width,
    height: fit.height,
  });
}

export async function createNUpPdf(
  file: File,
  options: NUpOptions,
  onProgress?: (progress: NUpProgress) => void,
): Promise<Uint8Array> {
  const password = options.password?.trim() || undefined;
  const grid = resolveNUpGrid(options);
  const perSheet = nUpPagesPerSheet(grid);

  onProgress?.({ phase: "loading", currentSheet: 0, totalSheets: 0 });

  const sourceBytes = new Uint8Array(await file.arrayBuffer());
  const source = await loadDocument(sourceBytes, password);
  if (source.isEncrypted && !password) {
    throw new Error("This PDF is password-protected. Enter the password to create an N-Up layout.");
  }

  const sourcePageCount = source.getPageCount();
  const totalSheets = nUpOutputSheetCount(sourcePageCount, grid);
  const firstPage = source.getPage(0);
  const { width: sheetW, height: sheetH } = firstPage.getSize();
  const cellW = sheetW / grid.cols;
  const cellH = sheetH / grid.rows;

  const out = await PDFDocument.create();
  const embeddedPages: PDFEmbeddedPage[] = [];
  for (let i = 0; i < sourcePageCount; i += 1) {
    embeddedPages.push(await out.embedPage(source.getPage(i)));
  }

  for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex += 1) {
    onProgress?.({ phase: "arranging", currentSheet: sheetIndex + 1, totalSheets });

    const sheet = out.addPage([sheetW, sheetH]);

    for (let row = 0; row < grid.rows; row += 1) {
      for (let col = 0; col < grid.cols; col += 1) {
        const slot = sheetIndex * perSheet + row * grid.cols + col;
        const cellX = col * cellW;
        const cellY = sheetH - (row + 1) * cellH;

        if (col > 0) {
          sheet.drawLine({
            start: { x: cellX, y: cellY },
            end: { x: cellX, y: cellY + cellH },
            thickness: 0.35,
            color: rgb(0.86, 0.86, 0.88),
          });
        }
        if (row > 0) {
          sheet.drawLine({
            start: { x: cellX, y: cellY + cellH },
            end: { x: cellX + cellW, y: cellY + cellH },
            thickness: 0.35,
            color: rgb(0.86, 0.86, 0.88),
          });
        }

        if (slot < sourcePageCount) {
          drawEmbeddedInCell(sheet, embeddedPages[slot], cellX, cellY, cellW, cellH);
        } else {
          drawBlankCell(sheet, cellX, cellY, cellW, cellH);
        }
      }
    }
  }

  const title = source.getTitle();
  if (title) out.setTitle(`${title} (N-Up)`);
  out.setProducer("JoinMyPDF N-Up PDF");
  out.setCreator("JoinMyPDF N-Up PDF (Multiple Pages per Sheet)");
  out.setModificationDate(new Date());

  onProgress?.({ phase: "finalizing", currentSheet: totalSheets, totalSheets });

  return out.save();
}

export function nUpPdfOutputName(file: File) {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}-n-up.pdf`;
}
