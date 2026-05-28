import { PDFDocument, StandardFonts, type PDFFont, rgb } from "pdf-lib-with-encrypt";
import { classifyPdfError } from "./pdf-errors";
import { formatBytes } from "./pdf-to-word";

export { formatBytes };

export type EbookFontSizePreset = "small" | "medium" | "large";
export type EbookMarginPreset = "compact" | "normal";

export type EbookToPdfOptions = {
  fontSize: EbookFontSizePreset;
  margin: EbookMarginPreset;
};

export type EbookToPdfProgressPhase = "extracting" | "parsing" | "layout" | "complete";

export type EbookMeta = {
  chapterCount: number;
  title: string;
};

type Chapter = {
  id: string;
  title: string;
  paragraphs: string[];
};

type RenderContext = {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  fontSize: number;
  lineHeight: number;
  margin: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  cursorY: number;
  page: ReturnType<PDFDocument["addPage"]>;
};

const A4 = { width: 595.28, height: 841.89 };
const BODY_COLOR = rgb(0.12, 0.14, 0.18);
const MUTED_COLOR = rgb(0.4, 0.46, 0.56);

function isEpubFile(file: File): boolean {
  return /\.epub$/i.test(file.name) || file.type === "application/epub+zip";
}

function normalizeZipPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

function dirname(path: string): string {
  const p = normalizeZipPath(path);
  const idx = p.lastIndexOf("/");
  return idx === -1 ? "" : p.slice(0, idx);
}

function resolveRelativePath(baseDir: string, relativePath: string): string {
  if (!relativePath) return normalizeZipPath(baseDir);
  if (/^[a-z]+:/i.test(relativePath)) return relativePath;
  const cleanBase = normalizeZipPath(baseDir);
  const cleanRel = normalizeZipPath(relativePath.split("#")[0].split("?")[0]);
  if (!cleanRel) return cleanBase;
  if (cleanRel.startsWith("/")) return cleanRel.replace(/^\/+/, "");

  const stack = cleanBase ? cleanBase.split("/") : [];
  for (const part of cleanRel.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function parserError(doc: Document): boolean {
  return Boolean(doc.querySelector("parsererror"));
}

function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (parserError(doc)) {
    throw new Error("Could not parse EPUB XML data.");
  }
  return doc;
}

function parseXhtml(content: string): Document {
  const doc = new DOMParser().parseFromString(content, "application/xhtml+xml");
  if (!parserError(doc)) return doc;
  const htmlDoc = new DOMParser().parseFromString(content, "text/html");
  return htmlDoc;
}

function collectChapterParagraphs(doc: Document): { title: string; paragraphs: string[] } {
  const body = doc.body || doc.querySelector("body");
  if (!body) return { title: "", paragraphs: [] };

  const titleNode = body.querySelector("h1, h2, h3, title");
  const title = (titleNode?.textContent || "").replace(/\s+/g, " ").trim();

  const paragraphs: string[] = [];
  const blocks = body.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li, blockquote, pre");
  blocks.forEach((node) => {
    const text = (node.textContent || "").replace(/\s+/g, " ").trim();
    if (text) paragraphs.push(text);
  });

  if (!paragraphs.length) {
    const fallback = (body.textContent || "").replace(/\s+/g, " ").trim();
    if (fallback) {
      fallback
        .split(/(?<=[.!?])\s+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => paragraphs.push(line));
    }
  }

  return { title, paragraphs };
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fontSizeValue(preset: EbookFontSizePreset): number {
  if (preset === "small") return 10;
  if (preset === "large") return 13;
  return 11;
}

function marginValue(preset: EbookMarginPreset): number {
  return preset === "compact" ? 34 : 48;
}

function initContext(doc: PDFDocument, options: EbookToPdfOptions, font: PDFFont, bold: PDFFont): RenderContext {
  const margin = marginValue(options.margin);
  const page = doc.addPage([A4.width, A4.height]);
  const fontSize = fontSizeValue(options.fontSize);
  return {
    doc,
    font,
    bold,
    fontSize,
    lineHeight: fontSize * 1.45,
    margin,
    pageWidth: A4.width,
    pageHeight: A4.height,
    contentWidth: A4.width - margin * 2,
    cursorY: A4.height - margin,
    page,
  };
}

function newPage(ctx: RenderContext) {
  ctx.page = ctx.doc.addPage([ctx.pageWidth, ctx.pageHeight]);
  ctx.cursorY = ctx.pageHeight - ctx.margin;
}

function ensureSpace(ctx: RenderContext, needed: number) {
  if (ctx.cursorY - needed >= ctx.margin) return;
  newPage(ctx);
}

function drawHeading(ctx: RenderContext, text: string) {
  const size = Math.max(ctx.fontSize + 3, 14);
  const lineHeight = size * 1.35;
  const lines = wrapLines(text, ctx.bold, size, ctx.contentWidth);
  if (!lines.length) return;
  ensureSpace(ctx, lines.length * lineHeight + 8);
  for (const line of lines) {
    ctx.page.drawText(line, {
      x: ctx.margin,
      y: ctx.cursorY - size,
      size,
      font: ctx.bold,
      color: BODY_COLOR,
    });
    ctx.cursorY -= lineHeight;
  }
  ctx.cursorY -= 5;
}

function drawParagraph(ctx: RenderContext, text: string) {
  const lines = wrapLines(text, ctx.font, ctx.fontSize, ctx.contentWidth);
  if (!lines.length) return;
  ensureSpace(ctx, lines.length * ctx.lineHeight);
  for (const line of lines) {
    ctx.page.drawText(line, {
      x: ctx.margin,
      y: ctx.cursorY - ctx.fontSize,
      size: ctx.fontSize,
      font: ctx.font,
      color: BODY_COLOR,
    });
    ctx.cursorY -= ctx.lineHeight;
  }
  ctx.cursorY -= 4;
}

function drawChapterLabel(ctx: RenderContext, text: string) {
  const size = Math.max(9, ctx.fontSize - 1);
  ensureSpace(ctx, size * 2);
  ctx.page.drawText(text, {
    x: ctx.margin,
    y: ctx.cursorY - size,
    size,
    font: ctx.font,
    color: MUTED_COLOR,
  });
  ctx.cursorY -= size * 1.8;
}

async function readBookTitle(
  zip: { file: (path: string) => { async: (type: "text") => Promise<string> } | null },
  rootOpfPath: string,
): Promise<string> {
  const opfFile = zip.file(rootOpfPath);
  if (!opfFile) return "";
  const opfText = await opfFile.async("text");
  const opfDoc = parseXml(opfText);
  const titleNode = opfDoc.querySelector("metadata > title, metadata > dc\\:title, dc\\:title, title");
  return (titleNode?.textContent || "").replace(/\s+/g, " ").trim();
}

async function extractEpubChapters(arrayBuffer: ArrayBuffer): Promise<{ title: string; chapters: Chapter[] }> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(arrayBuffer);

  const containerEntry = zip.file("META-INF/container.xml");
  if (!containerEntry) {
    throw new Error("Could not find META-INF/container.xml in this EPUB.");
  }

  const containerXml = await containerEntry.async("text");
  const containerDoc = parseXml(containerXml);
  const rootFilePath =
    containerDoc.querySelector("rootfile")?.getAttribute("full-path") ||
    containerDoc.querySelector("rootfile")?.getAttribute("fullpath");
  if (!rootFilePath) {
    throw new Error("Could not resolve the EPUB package document.");
  }

  const opfPath = normalizeZipPath(rootFilePath);
  const opfDir = dirname(opfPath);
  const opfEntry = zip.file(opfPath);
  if (!opfEntry) throw new Error("Could not open EPUB package metadata file.");

  const opfText = await opfEntry.async("text");
  const opfDoc = parseXml(opfText);

  const manifest = new Map<string, string>();
  opfDoc.querySelectorAll("manifest > item").forEach((item) => {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    const mediaType = item.getAttribute("media-type") || "";
    if (!id || !href) return;
    if (
      mediaType.includes("xhtml") ||
      mediaType.includes("html") ||
      href.endsWith(".xhtml") ||
      href.endsWith(".html") ||
      href.endsWith(".htm")
    ) {
      manifest.set(id, resolveRelativePath(opfDir, href));
    }
  });

  const spineRefs = Array.from(opfDoc.querySelectorAll("spine > itemref"))
    .map((node) => node.getAttribute("idref") || "")
    .filter(Boolean);

  const chapters: Chapter[] = [];
  for (const idref of spineRefs) {
    const chapterPath = manifest.get(idref);
    if (!chapterPath) continue;
    const entry = zip.file(chapterPath);
    if (!entry) continue;
    const chapterText = await entry.async("text");
    const chapterDoc = parseXhtml(chapterText);
    const { title, paragraphs } = collectChapterParagraphs(chapterDoc);
    if (!paragraphs.length) continue;
    chapters.push({ id: idref, title: title || `Chapter ${chapters.length + 1}`, paragraphs });
  }

  if (!chapters.length) {
    throw new Error("No readable chapter content was found in this EPUB.");
  }

  const title = await readBookTitle(zip, opfPath);
  return { title, chapters };
}

export async function readEbookMeta(file: File): Promise<EbookMeta> {
  if (!isEpubFile(file)) {
    throw new Error("Please upload an .epub file.");
  }
  if (file.size === 0) {
    throw new Error("That eBook file is empty.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const { title, chapters } = await extractEpubChapters(arrayBuffer);
  return {
    chapterCount: chapters.length,
    title: title || file.name.replace(/\.epub$/i, ""),
  };
}

export async function convertEbookToPdfBytes(
  file: File,
  options: EbookToPdfOptions,
  onProgress?: (phase: EbookToPdfProgressPhase, percent: number) => void,
): Promise<Uint8Array> {
  if (!isEpubFile(file)) throw new Error("Please upload an .epub file.");
  if (file.size === 0) throw new Error("That eBook file is empty.");

  onProgress?.("extracting", 14);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const parsed = await extractEpubChapters(arrayBuffer);

    onProgress?.("parsing", 44);

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.TimesRoman);
    const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
    const ctx = initContext(pdf, options, font, bold);

    drawHeading(ctx, parsed.title || "EPUB Export");
    drawChapterLabel(ctx, `${parsed.chapters.length} chapter${parsed.chapters.length === 1 ? "" : "s"} extracted`);

    onProgress?.("layout", 72);

    parsed.chapters.forEach((chapter, index) => {
      if (index > 0) {
        newPage(ctx);
      }
      drawChapterLabel(ctx, `Chapter ${index + 1}`);
      drawHeading(ctx, chapter.title || `Chapter ${index + 1}`);
      chapter.paragraphs.forEach((paragraph) => drawParagraph(ctx, paragraph));
    });

    onProgress?.("complete", 96);
    return await pdf.save({ useObjectStreams: false });
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function ebookToPdfOutputName(file: File): string {
  const base = file.name.replace(/\.epub$/i, "") || "ebook";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "ebook";
  return `joinmypdf-${slug}.pdf`;
}
