import { classifyPdfError } from "./pdf-errors";
import { formatBytes } from "./pdf-to-word";

export { formatBytes };

const XLSX_RENDER_ROOT_ID = "joinmypdf-excel-to-pdf-render-root";
/** A4 landscape content width at ~96 DPI. */
const A4_LANDSCAPE_WIDTH_PX = 1123;

export type ExcelToPdfProgress = {
  phase: "parsing" | "rendering" | "building";
  currentSheet?: number;
  totalSheets?: number;
};

export type ExcelWorkbookMeta = {
  sheetCount: number;
  sheetNames: string[];
};

function isXlsxBytes(bytes: Uint8Array, fileName: string): boolean {
  if (/\.xlsx$/i.test(fileName)) return true;
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sheetHasData(sheet: Record<string, unknown> | undefined): boolean {
  if (!sheet) return false;
  const ref = sheet["!ref"];
  return typeof ref === "string" && ref.length > 0;
}

export async function readExcelWorkbookMeta(file: File): Promise<ExcelWorkbookMeta> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (!isXlsxBytes(bytes, file.name)) {
    throw new Error("Please upload a valid .xlsx Excel workbook.");
  }

  const XLSX = await import("xlsx");
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetNames = workbook.SheetNames ?? [];

  return {
    sheetCount: sheetNames.length,
    sheetNames,
  };
}

function buildWorkbookHtml(
  sheetNames: string[],
  sheets: Record<string, Record<string, unknown>>,
  sheetToHtml: (sheet: Record<string, unknown>) => string,
): string {
  const sections: string[] = [];

  for (const name of sheetNames) {
    const sheet = sheets[name];
    if (!sheetHasData(sheet)) continue;
    const tableHtml = sheetToHtml(sheet);
    if (!tableHtml.trim()) continue;
    sections.push(
      `<section class="sheet"><h2>${escapeHtml(name)}</h2><div class="sheet-table">${tableHtml}</div></section>`,
    );
  }

  return sections.join("\n");
}

function buildRenderHost(html: string): HTMLElement {
  const existing = document.getElementById(XLSX_RENDER_ROOT_ID);
  existing?.remove();

  const host = document.createElement("div");
  host.id = XLSX_RENDER_ROOT_ID;
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = `${A4_LANDSCAPE_WIDTH_PX}px`;
  host.style.background = "#ffffff";
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";

  const inner = document.createElement("div");
  inner.className = "joinmypdf-xlsx-render";
  inner.style.width = `${A4_LANDSCAPE_WIDTH_PX}px`;
  inner.style.padding = "36px 40px";
  inner.style.boxSizing = "border-box";
  inner.style.fontFamily = 'Calibri, "Segoe UI", Arial, sans-serif';
  inner.style.fontSize = "10pt";
  inner.style.lineHeight = "1.35";
  inner.style.background = "#ffffff";
  inner.style.color = "#0a0a0a";
  inner.innerHTML = html;

  const style = document.createElement("style");
  style.textContent = `
    .joinmypdf-xlsx-render .sheet + .sheet { margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #e5e5e5; }
    .joinmypdf-xlsx-render h2 { margin: 0 0 0.75rem; font-size: 13pt; font-weight: 700; color: #171717; }
    .joinmypdf-xlsx-render table { border-collapse: collapse; width: max-content; min-width: 100%; margin: 0; }
    .joinmypdf-xlsx-render th, .joinmypdf-xlsx-render td {
      border: 1px solid #a3a3a3;
      padding: 4px 8px;
      vertical-align: top;
      white-space: nowrap;
      font-size: 9.5pt;
    }
    .joinmypdf-xlsx-render tr:first-child td,
    .joinmypdf-xlsx-render tr:first-child th {
      background: #f5f5f5;
      font-weight: 600;
    }
  `;

  host.appendChild(style);
  host.appendChild(inner);
  document.body.appendChild(host);
  return inner;
}

async function htmlElementToLandscapePdfBlob(element: HTMLElement): Promise<Blob> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const pdf = new jsPDF({ orientation: "l", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png", 1);

  let offsetY = 0;
  pdf.addImage(imgData, "PNG", 0, offsetY, imgWidth, imgHeight);
  let remaining = imgHeight - pageHeight;

  while (remaining > 0) {
    offsetY -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, offsetY, imgWidth, imgHeight);
    remaining -= pageHeight;
  }

  return pdf.output("blob");
}

export async function convertXlsxToPdf(
  file: File,
  onProgress?: (progress: ExcelToPdfProgress) => void,
): Promise<Blob> {
  if (file.size === 0) {
    throw new Error("That file is empty. Choose another Excel workbook.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (!isXlsxBytes(bytes, file.name)) {
    throw new Error("Please upload a valid .xlsx Excel workbook.");
  }

  onProgress?.({ phase: "parsing" });

  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetNames = workbook.SheetNames ?? [];

    if (!sheetNames.length) {
      throw new Error("This workbook has no sheets.");
    }

    const populated = sheetNames.filter((name) => sheetHasData(workbook.Sheets[name]));
    if (!populated.length) {
      throw new Error("All sheets in this workbook appear empty.");
    }

    onProgress?.({ phase: "rendering", currentSheet: 0, totalSheets: populated.length });

    const html = buildWorkbookHtml(sheetNames, workbook.Sheets, (sheet) =>
      XLSX.utils.sheet_to_html(sheet),
    );

    if (!html.trim()) {
      throw new Error("Could not generate table content from this workbook.");
    }

    const renderRoot = buildRenderHost(html);

    try {
      onProgress?.({ phase: "building", totalSheets: populated.length });
      return await htmlElementToLandscapePdfBlob(renderRoot);
    } finally {
      renderRoot.parentElement?.remove();
    }
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function excelToPdfOutputName(file: File): string {
  const base = file.name.replace(/\.xlsx$/i, "") || "spreadsheet";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "spreadsheet";
  return `joinmypdf-${slug}.pdf`;
}
