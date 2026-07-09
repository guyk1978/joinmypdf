import { classifyPdfError } from "./pdf-errors";
import { loadPdfDocument } from "./pdf-text-extract";

const LINE_TOLERANCE = 4;
const PARAGRAPH_GAP = 16;

export type PdfToHtmlProgress = {
  phase: "loading" | "extracting" | "building";
  currentPage: number;
  totalPages: number;
};

type RichFragment = {
  str: string;
  x: number;
  y: number;
  fontSize: number;
};

type LineRow = {
  y: number;
  text: string;
  fontSize: number;
};

type HtmlBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fontSizeFromTransform(transform: number[]): number {
  const scaleX = Math.abs(transform[0] ?? 12);
  const scaleY = Math.abs(transform[3] ?? scaleX);
  return Math.max(scaleX, scaleY, 8);
}

async function extractRichFragments(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof loadPdfDocument>>["getPage"]>>,
): Promise<RichFragment[]> {
  const content = await page.getTextContent();
  const fragments: RichFragment[] = [];

  for (const item of content.items) {
    if (!("str" in item) || typeof item.str !== "string") continue;
    const text = item.str.replace(/\s+/g, " ").trim();
    if (!text) continue;
    fragments.push({
      str: text,
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
      fontSize: fontSizeFromTransform(item.transform),
    });
  }

  return fragments;
}

function fragmentsToLines(fragments: RichFragment[]): LineRow[] {
  if (!fragments.length) return [];

  const sorted = [...fragments].sort((a, b) => b.y - a.y || a.x - b.x);
  const lineGroups: { y: number; parts: RichFragment[] }[] = [];

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
    .map((line) => {
      const parts = [...line.parts].sort((a, b) => a.x - b.x);
      const fontSize =
        parts.reduce((sum, part) => sum + part.fontSize, 0) / Math.max(parts.length, 1);
      return {
        y: line.y,
        text: parts
          .map((p) => p.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
        fontSize,
      };
    })
    .filter((row) => row.text.length > 0)
    .sort((a, b) => b.y - a.y);
}

function parseListLine(text: string): { isList: boolean; ordered: boolean; content: string } {
  const ordered = text.match(/^(\d+)[.)]\s+(.+)$/);
  if (ordered) {
    return { isList: true, ordered: true, content: ordered[2]!.trim() };
  }
  const bullet = text.match(/^[-•*●◦▪]\s+(.+)$/);
  if (bullet) {
    return { isList: true, ordered: false, content: bullet[1]!.trim() };
  }
  return { isList: false, ordered: false, content: text };
}

function linesToBlocks(lines: LineRow[]): HtmlBlock[] {
  if (!lines.length) return [];

  const bodySize = median(lines.map((line) => line.fontSize));
  const blocks: HtmlBlock[] = [];
  let paragraphBuffer = "";
  let listBuffer: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (!paragraphBuffer.trim()) return;
    blocks.push({ type: "paragraph", text: paragraphBuffer.trim() });
    paragraphBuffer = "";
  };

  const flushList = () => {
    if (!listBuffer || !listBuffer.items.length) return;
    blocks.push({ type: "list", ordered: listBuffer.ordered, items: listBuffer.items });
    listBuffer = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    const prev = i > 0 ? lines[i - 1] : null;
    const gap = prev ? Math.abs(prev.y - line.y) : 0;
    const list = parseListLine(line.text);

    if (gap > PARAGRAPH_GAP && !list.isList) {
      flushList();
      flushParagraph();
    }

    if (list.isList) {
      flushParagraph();
      if (!listBuffer || listBuffer.ordered !== list.ordered) {
        flushList();
        listBuffer = { ordered: list.ordered, items: [] };
      }
      listBuffer.items.push(list.content);
      continue;
    }

    flushList();

    if (line.fontSize >= bodySize * 1.45 && line.text.length <= 120) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: line.fontSize >= bodySize * 1.85 ? 2 : 3,
        text: line.text,
      });
      continue;
    }

    paragraphBuffer = paragraphBuffer ? `${paragraphBuffer} ${line.text}` : line.text;
  }

  flushList();
  flushParagraph();
  return blocks;
}

function median(values: number[]): number {
  if (!values.length) return 12;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function renderBlock(block: HtmlBlock): string {
  switch (block.type) {
    case "heading": {
      const tag = block.level === 2 ? "h2" : "h3";
      return `    <${tag}>${escapeHtml(block.text)}</${tag}>`;
    }
    case "paragraph":
      return `    <p>${escapeHtml(block.text)}</p>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items.map((item) => `      <li>${escapeHtml(item)}</li>`).join("\n");
      return `    <${tag}>\n${items}\n    </${tag}>`;
    }
    default:
      return "";
  }
}

function renderPageSection(pageNumber: number, blocks: HtmlBlock[]): string {
  if (!blocks.length) {
    return `  <section class="pdf-page" data-page="${pageNumber}" aria-label="Page ${pageNumber}">
    <p class="pdf-page__empty">No extractable text on this page. It may be scanned or image-only.</p>
  </section>`;
  }

  return `  <section class="pdf-page" data-page="${pageNumber}" aria-label="Page ${pageNumber}">
${blocks.map(renderBlock).join("\n")}
  </section>`;
}

function buildHtmlDocument(title: string, pageSections: string[]): string {
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <meta name="generator" content="JoinMyPDF PDF to HTML Converter">
  <style>
    :root { color-scheme: light dark; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.6; margin: 2rem auto; max-width: 48rem; padding: 0 1rem; color: #171717; background: #fafafa; }
    article { display: grid; gap: 2rem; }
    .pdf-page { display: grid; gap: 0.75rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e5e5; }
    .pdf-page:last-child { border-bottom: 0; padding-bottom: 0; }
    .pdf-page__empty { color: #737373; font-style: italic; }
    h2, h3 { line-height: 1.25; margin: 0; }
    h2 { font-size: 1.35rem; }
    h3 { font-size: 1.1rem; }
    p { margin: 0; }
    ul, ol { margin: 0; padding-left: 1.25rem; }
    @media (prefers-color-scheme: dark) {
      body { color: #f5f5f5; background: #0a0a0a; }
      .pdf-page { border-bottom-color: #262626; }
      .pdf-page__empty { color: #a3a3a3; }
    }
  </style>
</head>
<body>
  <article>
${pageSections.join("\n")}
  </article>
</body>
</html>
`;
}

export type PdfHtmlBlock = HtmlBlock;

export async function extractPdfStructuredPages(
  file: File,
  onProgress?: (progress: PdfToHtmlProgress) => void,
): Promise<{ title: string; pages: Array<{ pageNumber: number; blocks: HtmlBlock[] }> }> {
  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });
  const doc = await loadPdfDocument(file);
  const totalPages = doc.numPages;
  const pages: Array<{ pageNumber: number; blocks: HtmlBlock[] }> = [];

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    onProgress?.({ phase: "extracting", currentPage: pageNumber, totalPages });
    const page = await doc.getPage(pageNumber);
    const fragments = await extractRichFragments(page);
    pages.push({ pageNumber, blocks: linesToBlocks(fragmentsToLines(fragments)) });
  }

  const baseName = file.name.replace(/\.pdf$/i, "") || "document";
  return { title: baseName, pages };
}

export async function convertPdfToHtml(
  file: File,
  onProgress?: (progress: PdfToHtmlProgress) => void,
): Promise<Blob> {
  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });

  try {
    const doc = await loadPdfDocument(file);
    const totalPages = doc.numPages;
    const pageSections: string[] = [];
    let extractedBlocks = 0;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      onProgress?.({ phase: "extracting", currentPage: pageNumber, totalPages });
      const page = await doc.getPage(pageNumber);
      const fragments = await extractRichFragments(page);
      const blocks = linesToBlocks(fragmentsToLines(fragments));
      if (blocks.length) extractedBlocks += blocks.length;
      pageSections.push(renderPageSection(pageNumber, blocks));
    }

    if (extractedBlocks === 0) {
      throw new Error(
        "No text could be extracted. This PDF may be scanned or image-based—try a PDF with selectable text.",
      );
    }

    onProgress?.({ phase: "building", currentPage: totalPages, totalPages });
    const baseName = file.name.replace(/\.pdf$/i, "") || "document";
    const html = buildHtmlDocument(baseName, pageSections);
    return new Blob([html], { type: "text/html;charset=utf-8" });
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function pdfToHtmlOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return `joinmypdf-${slug}.html`;
}
