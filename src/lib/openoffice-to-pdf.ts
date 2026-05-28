import { PDFDocument, StandardFonts, type PDFPage, type PDFFont, rgb } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "./pdf-errors";
import { formatBytes } from "./pdf-to-word";

export { formatBytes };

export type OpenofficeFormat = "odt" | "ods" | "odp";

export type OpenofficeProgressPhase = "extracting" | "parsing" | "layout" | "complete";

export type OpenofficeMeta = {
  format: OpenofficeFormat;
  label: string;
};

type ContentBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string };

const A4_PORTRAIT = { width: 595.28, height: 841.89 };
const A4_LANDSCAPE = { width: 841.89, height: 595.28 };
const MARGIN = 48;
const BODY_RGB = rgb(0.12, 0.14, 0.18);
const MUTED_RGB = rgb(0.45, 0.5, 0.58);

function isOdfBytes(bytes: Uint8Array, fileName: string): boolean {
  if (/\.(odt|ods|odp)$/i.test(fileName)) return true;
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export function detectOpenofficeFormat(file: File): OpenofficeFormat | null {
  const match = file.name.match(/\.(odt|ods|odp)$/i);
  if (!match) return null;
  return match[1].toLowerCase() as OpenofficeFormat;
}

export function openofficeFormatLabel(format: OpenofficeFormat): string {
  if (format === "odt") return "OpenDocument Text (.odt)";
  if (format === "ods") return "OpenDocument Spreadsheet (.ods)";
  return "OpenDocument Presentation (.odp)";
}

function textContentOf(el: Element): string {
  return (el.textContent || "").replace(/\s+/g, " ").trim();
}

function elementsByLocalName(root: Element, localName: string): Element[] {
  const found: Element[] = [];
  const walk = (node: Element) => {
    if (node.localName === localName) found.push(node);
    for (const child of Array.from(node.children)) {
      if (child instanceof Element) walk(child);
    }
  };
  walk(root);
  return found;
}

function firstByLocalName(root: Element, localName: string): Element | null {
  for (const el of elementsByLocalName(root, localName)) return el;
  return null;
}

function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Could not parse OpenDocument content.xml.");
  }
  return doc;
}

async function extractContentXml(arrayBuffer: ArrayBuffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(arrayBuffer);
  const entry = zip.file("content.xml");
  if (!entry) {
    throw new Error("This archive is missing content.xml. Upload a valid .odt, .ods, or .odp file.");
  }
  return entry.async("text");
}

function parseOdtBlocks(xml: string): ContentBlock[] {
  const doc = parseXml(xml);
  const textRoot = firstByLocalName(doc.documentElement, "text");
  const root = textRoot ?? doc.documentElement;
  const blocks: ContentBlock[] = [];

  const walk = (node: Element) => {
    const ln = node.localName;
    if (ln === "h") {
      const level = Number(node.getAttribute("text:outline-level") || node.getAttribute("outline-level") || "1");
      const text = textContentOf(node);
      if (text) blocks.push({ kind: "heading", level: Number.isFinite(level) ? level : 1, text });
      return;
    }
    if (ln === "p") {
      const text = textContentOf(node);
      if (text) blocks.push({ kind: "paragraph", text });
      return;
    }
    for (const child of Array.from(node.children)) {
      if (child instanceof Element) walk(child);
    }
  };

  walk(root);
  return blocks;
}

function parseOdsRows(xml: string): string[][] {
  const doc = parseXml(xml);
  const rows: string[][] = [];

  for (const rowEl of elementsByLocalName(doc.documentElement, "table-row")) {
    const row: string[] = [];
    for (const cellEl of elementsByLocalName(rowEl, "table-cell")) {
      const parts: string[] = [];
      for (const p of elementsByLocalName(cellEl, "p")) {
        const t = textContentOf(p);
        if (t) parts.push(t);
      }
      row.push(parts.join(" ").trim());
    }
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  return rows;
}

function parseOdpSlides(xml: string): string[][] {
  const doc = parseXml(xml);
  const slides: string[][] = [];

  for (const pageEl of elementsByLocalName(doc.documentElement, "page")) {
    const lines: string[] = [];
    for (const p of elementsByLocalName(pageEl, "p")) {
      const t = textContentOf(p);
      if (t) lines.push(t);
    }
    if (!lines.length) {
      const fallback = textContentOf(pageEl);
      if (fallback) lines.push(fallback);
    }
    slides.push(lines);
  }

  if (!slides.length) {
    const paragraphs = elementsByLocalName(doc.documentElement, "p")
      .map(textContentOf)
      .filter(Boolean);
    if (paragraphs.length) slides.push(paragraphs);
  }

  return slides;
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

class PdfTextLayout {
  private doc: PDFDocument;
  private font: PDFFont;
  private bold: PDFFont;
  private page: PDFPage;
  private cursorY: number;
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private readonly contentWidth: number;

  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont, size: { width: number; height: number }) {
    this.doc = doc;
    this.font = font;
    this.bold = bold;
    this.pageWidth = size.width;
    this.pageHeight = size.height;
    this.contentWidth = size.width - MARGIN * 2;
    this.page = doc.addPage([size.width, size.height]);
    this.cursorY = size.height - MARGIN;
  }

  private ensureSpace(needed: number) {
    if (this.cursorY - needed >= MARGIN) return;
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([this.pageWidth, this.pageHeight]);
    this.cursorY = this.pageHeight - MARGIN;
  }

  drawHeading(text: string, level: number) {
    const size = level <= 1 ? 16 : level === 2 ? 14 : 12;
    const lineHeight = size * 1.45;
    const lines = wrapLines(text, this.bold, size, this.contentWidth);
    this.ensureSpace(lines.length * lineHeight + 8);
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN,
        y: this.cursorY - size,
        size,
        font: this.bold,
        color: BODY_RGB,
      });
      this.cursorY -= lineHeight;
    }
    this.cursorY -= 6;
  }

  drawParagraph(text: string, size = 11) {
    const lineHeight = size * 1.4;
    const lines = wrapLines(text, this.font, size, this.contentWidth);
    if (!lines.length) return;
    this.ensureSpace(lines.length * lineHeight);
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN,
        y: this.cursorY - size,
        size,
        font: this.font,
        color: BODY_RGB,
      });
      this.cursorY -= lineHeight;
    }
    this.cursorY -= 4;
  }

  drawLabel(text: string) {
    const size = 9;
    this.ensureSpace(size * 2);
    this.page.drawText(text, {
      x: MARGIN,
      y: this.cursorY - size,
      size,
      font: this.font,
      color: MUTED_RGB,
    });
    this.cursorY -= size * 1.8;
  }

  drawTable(rows: string[][], colWidth: number, fontSize = 9) {
    const lineHeight = fontSize * 1.35;
    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r];
      const rowHeight = lineHeight + 6;
      this.ensureSpace(rowHeight + 4);
      let x = MARGIN;
      for (let c = 0; c < row.length; c += 1) {
        const cell = row[c] || "";
        const clipped =
          cell.length > 42 ? `${cell.slice(0, 39)}…` : cell;
        this.page.drawText(clipped, {
          x,
          y: this.cursorY - fontSize,
          size: fontSize,
          font: r === 0 ? this.bold : this.font,
          color: BODY_RGB,
          maxWidth: colWidth - 8,
        });
        x += colWidth;
        if (x + colWidth > this.pageWidth - MARGIN) break;
      }
      this.cursorY -= rowHeight;
    }
    this.cursorY -= 8;
  }
}

async function buildOdtPdf(blocks: ContentBlock[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const layout = new PdfTextLayout(doc, font, bold, A4_PORTRAIT);

  if (!blocks.length) {
    layout.drawParagraph("[No extractable text in this document.]");
  } else {
    for (const block of blocks) {
      if (block.kind === "heading") layout.drawHeading(block.text, block.level);
      else layout.drawParagraph(block.text);
    }
  }

  return doc.save({ useObjectStreams: false });
}

async function buildOdsPdf(rows: string[][]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const layout = new PdfTextLayout(doc, font, bold, A4_LANDSCAPE);

  if (!rows.length) {
    layout.drawParagraph("[No spreadsheet cells with text were found.]");
  } else {
    const maxCols = Math.min(8, Math.max(1, ...rows.map((r) => r.length)));
    const colWidth = (A4_LANDSCAPE.width - MARGIN * 2) / maxCols;
    const trimmed = rows.map((row) => row.slice(0, maxCols));
    layout.drawTable(trimmed, colWidth);
  }

  return doc.save({ useObjectStreams: false });
}

async function buildOdpPdf(slides: string[][]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const layout = new PdfTextLayout(doc, font, bold, A4_LANDSCAPE);

  if (!slides.length) {
    layout.drawParagraph("[No slide text could be extracted from this presentation.]");
    return doc.save({ useObjectStreams: false });
  }

  slides.forEach((lines, index) => {
    if (index > 0) layout.newPage();
    layout.drawLabel(`Slide ${index + 1}`);
    if (!lines.length) {
      layout.drawParagraph("[No text on this slide]");
    } else {
      lines.forEach((line, i) => {
        if (i === 0) layout.drawHeading(line, 1);
        else layout.drawParagraph(line);
      });
    }
  });

  return doc.save({ useObjectStreams: false });
}

export async function readOpenofficeMeta(file: File): Promise<OpenofficeMeta> {
  const format = detectOpenofficeFormat(file);
  if (!format) {
    throw new Error("Please upload a .odt, .ods, or .odp OpenOffice file.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isOdfBytes(bytes, file.name)) {
    throw new Error("This file does not look like a valid OpenDocument archive.");
  }
  return { format, label: openofficeFormatLabel(format) };
}

export async function convertOpenofficeToPdfBytes(
  file: File,
  onProgress?: (phase: OpenofficeProgressPhase, percent: number) => void,
): Promise<Uint8Array> {
  if (!file) throw new Error("Choose a file to convert.");
  if (file.size === 0) throw new Error("That file is empty.");

  const format = detectOpenofficeFormat(file);
  if (!format) {
    throw new Error("Please upload a .odt, .ods, or .odp OpenOffice file.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (!isOdfBytes(bytes, file.name)) {
    throw new Error("This file does not look like a valid OpenDocument archive.");
  }

  onProgress?.("extracting", 12);

  try {
    const contentXml = await extractContentXml(arrayBuffer);
    onProgress?.("parsing", 40);

    onProgress?.("layout", 72);

    if (format === "odt") {
      const blocks = parseOdtBlocks(contentXml);
      if (!blocks.length) {
        throw new Error("No text paragraphs were found in this document.");
      }
      const pdf = await buildOdtPdf(blocks);
      onProgress?.("complete", 95);
      return pdf;
    }

    if (format === "ods") {
      const rows = parseOdsRows(contentXml);
      if (!rows.length) {
        throw new Error("No spreadsheet rows with text were found.");
      }
      const pdf = await buildOdsPdf(rows);
      onProgress?.("complete", 95);
      return pdf;
    }

    const slides = parseOdpSlides(contentXml);
    if (!slides.length) {
      throw new Error("No presentation slides with text were found.");
    }
    const pdf = await buildOdpPdf(slides);
    onProgress?.("complete", 95);
    return pdf;
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function openofficeToPdfOutputName(file: File): string {
  const base = file.name.replace(/\.(odt|ods|odp)$/i, "") || "document";
  return `${base}.pdf`;
}