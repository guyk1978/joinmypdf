import { Document, Packer, PageBreak, Paragraph, TextRun } from "docx";
import { classifyPdfError } from "./pdf-errors";

const LINE_TOLERANCE = 4;
const PARAGRAPH_GAP = 16;

type TextFragment = {
  str: string;
  x: number;
  y: number;
};

async function setupPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const version = (pdfjs as unknown as { version?: string }).version || "5.7.284";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

function isPdfHeader(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

function groupFragmentsIntoParagraphs(fragments: TextFragment[]): string[] {
  if (!fragments.length) return [];

  const sorted = [...fragments].sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: { y: number; parts: TextFragment[] }[] = [];
  for (const frag of sorted) {
    const line = lines.find((entry) => Math.abs(entry.y - frag.y) <= LINE_TOLERANCE);
    if (line) {
      line.parts.push(frag);
      line.y = (line.y + frag.y) / 2;
    } else {
      lines.push({ y: frag.y, parts: [frag] });
    }
  }

  const lineRows = lines
    .map((line) => ({
      y: line.y,
      text: line.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    }))
    .filter((row) => row.text.length > 0)
    .sort((a, b) => b.y - a.y);

  const paragraphs: string[] = [];
  let buffer = "";
  let prevY: number | null = null;

  for (const row of lineRows) {
    if (prevY !== null && Math.abs(prevY - row.y) > PARAGRAPH_GAP) {
      if (buffer.trim()) paragraphs.push(buffer.trim());
      buffer = row.text;
    } else {
      buffer = buffer ? `${buffer} ${row.text}` : row.text;
    }
    prevY = row.y;
  }

  if (buffer.trim()) paragraphs.push(buffer.trim());
  return paragraphs;
}

async function extractPageParagraphs(
  page: Awaited<
    ReturnType<
      Awaited<ReturnType<Awaited<ReturnType<typeof setupPdfJs>>["getDocument"]>["promise"]>["getPage"]
    >
  >,
): Promise<string[]> {
  const content = await page.getTextContent();
  const fragments: TextFragment[] = [];

  for (const item of content.items) {
    if (!("str" in item) || typeof item.str !== "string") continue;
    const text = item.str.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const transform = item.transform;
    fragments.push({
      str: text,
      x: transform[4] ?? 0,
      y: transform[5] ?? 0,
    });
  }

  return groupFragmentsIntoParagraphs(fragments);
}

export type PdfToWordProgress = {
  phase: "loading" | "extracting" | "building";
  currentPage: number;
  totalPages: number;
};

export async function convertPdfToDocx(
  file: File,
  onProgress?: (progress: PdfToWordProgress) => void,
): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfHeader(bytes)) {
    throw new Error("This file does not look like a valid PDF.");
  }

  onProgress?.({ phase: "loading", currentPage: 0, totalPages: 0 });

  const pdfjs = await setupPdfJs();

  try {
    const doc = await pdfjs.getDocument({ data: bytes }).promise;
    const totalPages = doc.numPages;
    if (totalPages === 0) {
      throw new Error("This PDF has no pages to convert.");
    }

    const children: Paragraph[] = [];
    let extractedBlocks = 0;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      onProgress?.({ phase: "extracting", currentPage: pageNumber, totalPages });

      if (pageNumber > 1) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Page ${pageNumber}`,
              bold: true,
              size: 22,
              color: "64748B",
            }),
          ],
          spacing: { after: 160 },
        }),
      );

      const page = await doc.getPage(pageNumber);
      const paragraphs = await extractPageParagraphs(page);

      if (!paragraphs.length) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "[No extractable text on this page — it may be scanned or image-only.]",
                italics: true,
                color: "94A3B8",
              }),
            ],
            spacing: { after: 200 },
          }),
        );
        continue;
      }

      extractedBlocks += paragraphs.length;
      for (const text of paragraphs) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text, size: 24 })],
            spacing: { after: 200 },
          }),
        );
      }
    }

    if (extractedBlocks === 0) {
      throw new Error(
        "No text could be extracted. This PDF may be scanned or image-based—try a PDF with selectable text.",
      );
    }

    onProgress?.({ phase: "building", currentPage: totalPages, totalPages });

    const wordDoc = new Document({
      sections: [{ children }],
    });

    return Packer.toBlob(wordDoc);
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function pdfToWordOutputName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return `joinmypdf-${slug}.docx`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
