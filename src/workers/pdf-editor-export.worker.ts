/// <reference lib="webworker" />

import { prepareRtlLineForPdf } from "../lib/pdf-rtl-text";
import type { PdfEditorBlock, PdfEditorTextRun } from "./pdf-editor-export.types";

export type { PdfEditorBlock, PdfEditorTextRun } from "./pdf-editor-export.types";

export type PdfEditorPageExport = {
  pageIndex: number;
  width: number;
  height: number;
  blocks: PdfEditorBlock[];
};

export type PdfEditorExportRequest = {
  type: "export";
  pages: PdfEditorPageExport[];
  /** DejaVu (or other Unicode) TTF bytes — supports Hebrew + Latin. */
  fontRegular: ArrayBuffer;
  fontBold: ArrayBuffer;
};

export type PdfEditorExportResponse =
  | { type: "progress"; percent: number; status: string }
  | { type: "ok"; buffer: ArrayBuffer }
  | { type: "error"; message: string };

const MARGIN_RATIO = 0.08;

const reply = (payload: PdfEditorExportResponse, transfer?: Transferable[]) => {
  (self as DedicatedWorkerGlobalScope).postMessage(payload, transfer ?? []);
};

function wrapLine(
  text: string,
  font: { widthOfTextAtSize: (t: string, size: number) => number },
  size: number,
  maxWidth: number,
): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [""];
  const tokens = normalized.split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  const pushCurrent = () => {
    if (current) lines.push(current);
    current = "";
  };

  for (const token of tokens) {
    const candidate = current ? `${current} ${token}` : token;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    pushCurrent();
    if (font.widthOfTextAtSize(token, size) <= maxWidth) {
      current = token;
      continue;
    }
    let chunk = "";
    for (const ch of token) {
      const next = chunk + ch;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        chunk = next;
      } else {
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
    }
    current = chunk;
  }
  pushCurrent();
  return lines.length ? lines : [""];
}

function pickFont(
  run: PdfEditorTextRun | undefined,
  regular: unknown,
  bold: unknown,
) {
  return run?.bold ? bold : regular;
}

self.onmessage = async (event: MessageEvent<PdfEditorExportRequest>) => {
  const data = event.data;
  if (!data || data.type !== "export") return;

  try {
    reply({ type: "progress", percent: 5, status: "loading" });
    const { PDFDocument, rgb } = await import("pdf-lib-with-encrypt");
    const fontkitMod = await import("@pdf-lib/fontkit");
    const fontkit = (fontkitMod as { default?: unknown }).default ?? fontkitMod;

    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit as never);

    // DejaVu Sans embeds Hebrew glyphs. Do not subset — subsetting can drop RTL code points.
    const fontRegular = await doc.embedFont(new Uint8Array(data.fontRegular), {
      subset: false,
    });
    const fontBold = await doc.embedFont(new Uint8Array(data.fontBold), {
      subset: false,
    });

    reply({ type: "progress", percent: 15, status: "layout" });

    const pages = [...data.pages].sort((a, b) => a.pageIndex - b.pageIndex);
    if (!pages.length) {
      throw new Error("No pages to export.");
    }

    const color = rgb(0.07, 0.07, 0.07);

    for (let i = 0; i < pages.length; i += 1) {
      const pageData = pages[i]!;
      const width = Math.max(200, pageData.width || 612);
      const height = Math.max(200, pageData.height || 792);
      const page = doc.addPage([width, height]);
      const margin = Math.max(36, Math.min(width, height) * MARGIN_RATIO);
      const contentWidth = width - margin * 2;
      let y = height - margin;

      const blocks = pageData.blocks.length
        ? pageData.blocks
        : [{ kind: "paragraph" as const, runs: [{ text: "" }] }];

      for (const block of blocks) {
        const isHeading = block.kind === "heading";
        const level = block.level ?? 1;
        const baseSize = isHeading ? (level === 1 ? 18 : level === 2 ? 15 : 13) : 11;
        const lineHeight = baseSize * 1.4;
        const paragraphGap = isHeading ? baseSize * 0.55 : 8;
        const plain = block.runs.map((run) => run.text).join("");

        if (!plain.trim()) {
          y -= lineHeight * 0.45;
          if (y < margin) break;
          continue;
        }

        const primary = block.runs[0];
        const metricFont = pickFont(primary, fontRegular, fontBold) as {
          widthOfTextAtSize: (t: string, size: number) => number;
        };
        // Wrap in logical order, then bidi-reorder each line to visual order for drawText.
        const lines = wrapLine(plain, metricFont, baseSize, contentWidth);

        for (const rawLine of lines) {
          if (y - lineHeight < margin) break;
          const font = pickFont(primary, fontRegular, fontBold) as {
            widthOfTextAtSize: (t: string, size: number) => number;
          };
          const prepared = prepareRtlLineForPdf(rawLine);
          const textWidth = font.widthOfTextAtSize(prepared.text, baseSize);
          // RTL: x = pageWidth - margin - textWidth
          const x = prepared.rtl ? width - margin - textWidth : margin;
          const drawX = Math.min(Math.max(margin * 0.25, x), width - margin * 0.25);
          const drawY = y - baseSize;

          page.drawText(prepared.text, {
            x: drawX,
            y: drawY,
            size: baseSize,
            font: font as never,
            color,
          });

          if (primary?.underline) {
            page.drawLine({
              start: { x: drawX, y: drawY - 1.5 },
              end: {
                x: drawX + textWidth,
                y: drawY - 1.5,
              },
              thickness: 0.75,
              color,
            });
          }

          y -= lineHeight;
        }

        y -= paragraphGap;
        if (y < margin) break;
      }

      reply({
        type: "progress",
        percent: Math.min(92, 15 + Math.round(((i + 1) / pages.length) * 75)),
        status: "writing",
      });
    }

    reply({ type: "progress", percent: 95, status: "saving" });
    const bytes = await doc.save({ useObjectStreams: false });
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    reply({ type: "ok", buffer: copy.buffer }, [copy.buffer]);
  } catch (error) {
    reply({
      type: "error",
      message: error instanceof Error ? error.message : "PDF export failed in worker.",
    });
  }
};

export {};
