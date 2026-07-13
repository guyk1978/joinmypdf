import type {
  PdfEditorBlock,
  PdfEditorExportRequest,
  PdfEditorExportResponse,
  PdfEditorPageExport,
} from "@/workers/pdf-editor-export.worker";

export type { PdfEditorBlock, PdfEditorTextRun } from "@/workers/pdf-editor-export.types";
export type { PdfEditorPageExport };

export function pdfEditorOutputName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "") || "document";
  return `${base}-edited.pdf`;
}

type TipTapMark = { type: string };
type TipTapTextNode = { type: "text"; text?: string; marks?: TipTapMark[] };
type TipTapNode = {
  type?: string;
  attrs?: { level?: number };
  content?: Array<TipTapNode | TipTapTextNode>;
  text?: string;
  marks?: TipTapMark[];
};

function runsFromInline(nodes: Array<TipTapNode | TipTapTextNode> | undefined): PdfEditorBlock["runs"] {
  if (!nodes?.length) return [{ text: "" }];
  const runs: PdfEditorBlock["runs"] = [];
  for (const node of nodes) {
    if (node.type === "hardBreak") {
      runs.push({ text: "\n" });
      continue;
    }
    if (node.type !== "text" || typeof node.text !== "string") continue;
    const marks = "marks" in node ? node.marks : undefined;
    runs.push({
      text: node.text,
      bold: marks?.some((mark) => mark.type === "bold"),
      italic: marks?.some((mark) => mark.type === "italic"),
      underline: marks?.some((mark) => mark.type === "underline"),
    });
  }
  return runs.length ? runs : [{ text: "" }];
}

/** Convert TipTap JSON document into exportable blocks for the PDF worker. */
export function tipTapJsonToBlocks(doc: TipTapNode | null | undefined): PdfEditorBlock[] {
  const content = doc?.content ?? [];
  const blocks: PdfEditorBlock[] = [];

  for (const node of content) {
    if (!node || typeof node !== "object") continue;
    if (node.type === "heading") {
      const level = Math.min(3, Math.max(1, Number(node.attrs?.level) || 1)) as 1 | 2 | 3;
      blocks.push({
        kind: "heading",
        level,
        runs: runsFromInline(node.content as Array<TipTapNode | TipTapTextNode>),
      });
      continue;
    }
    if (node.type === "paragraph" || node.type === "blockquote") {
      blocks.push({
        kind: "paragraph",
        runs: runsFromInline(node.content as Array<TipTapNode | TipTapTextNode>),
      });
      continue;
    }
    if (node.type === "bulletList" || node.type === "orderedList") {
      const ordered = node.type === "orderedList";
      const items = node.content ?? [];
      let index = 1;
      for (const item of items) {
        if (item.type !== "listItem") continue;
        const paragraph = item.content?.[0];
        const runs = runsFromInline(
          (paragraph && "content" in paragraph
            ? (paragraph.content as Array<TipTapNode | TipTapTextNode>)
            : undefined) ?? undefined,
        );
        const prefix = ordered ? `${index}. ` : "• ";
        index += 1;
        const withBullet = [...runs];
        if (withBullet[0]) {
          withBullet[0] = { ...withBullet[0], text: `${prefix}${withBullet[0].text}` };
        } else {
          withBullet.push({ text: prefix });
        }
        blocks.push({ kind: "paragraph", runs: withBullet });
      }
    }
  }

  return blocks.length ? blocks : [{ kind: "paragraph", runs: [{ text: "" }] }];
}

function htmlToTipTapJsonFallback(html: string): Record<string, unknown> {
  const paragraphs = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) ?? [];
  if (!paragraphs.length) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  return {
    type: "doc",
    content: paragraphs.map((block) => {
      const text = block
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim();
      return {
        type: "paragraph",
        content: text ? [{ type: "text", text }] : [],
      };
    }),
  };
}

function htmlToBlocks(html: string): PdfEditorBlock[] {
  if (typeof DOMParser === "undefined") {
    return tipTapJsonToBlocks(htmlToTipTapJsonFallback(html));
  }
  const parsed = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = parsed.getElementById("root");
  if (!root) return [{ kind: "paragraph", runs: [{ text: "" }] }];

  const blocks: PdfEditorBlock[] = [];

  const runsFromElement = (el: Element): PdfEditorBlock["runs"] => {
    const runs: PdfEditorBlock["runs"] = [];
    const walk = (node: Node, marks: { bold?: boolean; italic?: boolean; underline?: boolean }) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text) runs.push({ text, ...marks });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const element = node as Element;
      const tag = element.tagName.toLowerCase();
      const next = {
        bold: marks.bold || tag === "strong" || tag === "b",
        italic: marks.italic || tag === "em" || tag === "i",
        underline: marks.underline || tag === "u",
      };
      if (tag === "br") {
        runs.push({ text: "\n", ...marks });
        return;
      }
      for (const child of Array.from(element.childNodes)) walk(child, next);
    };
    walk(el, {});
    return runs.length ? runs : [{ text: "" }];
  };

  for (const child of Array.from(root.children)) {
    const tag = child.tagName.toLowerCase();
    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const level = Number(tag[1]) as 1 | 2 | 3;
      blocks.push({ kind: "heading", level, runs: runsFromElement(child) });
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      let index = 1;
      for (const li of Array.from(child.children)) {
        if (li.tagName.toLowerCase() !== "li") continue;
        const runs = runsFromElement(li);
        const prefix = tag === "ol" ? `${index}. ` : "• ";
        index += 1;
        if (runs[0]) runs[0] = { ...runs[0], text: `${prefix}${runs[0].text}` };
        blocks.push({ kind: "paragraph", runs });
      }
      continue;
    }
    if (tag === "p" || tag === "div") {
      blocks.push({ kind: "paragraph", runs: runsFromElement(child) });
    }
  }

  return blocks.length ? blocks : [{ kind: "paragraph", runs: [{ text: "" }] }];
}

export function pageDocToBlocks(doc: {
  html?: string;
  json?: Record<string, unknown>;
}): PdfEditorBlock[] {
  if (doc.json && Array.isArray((doc.json as { content?: unknown }).content)) {
    const fromJson = tipTapJsonToBlocks(doc.json as never);
    const hasText = fromJson.some((block) => block.runs.some((run) => run.text.trim()));
    if (hasText) return fromJson;
  }
  if (doc.html) return htmlToBlocks(doc.html);
  return [{ kind: "paragraph", runs: [{ text: "" }] }];
}

let fontCache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;

async function loadExportFonts(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
  if (fontCache) {
    return {
      regular: fontCache.regular.slice(0),
      bold: fontCache.bold.slice(0),
    };
  }
  // DejaVu Sans — Unicode TTF with Hebrew. StandardFonts (Helvetica/etc.) cannot render HE.
  const base =
    typeof window !== "undefined" ? `${window.location.origin}/assets/fonts` : "/assets/fonts";
  const [regularRes, boldRes] = await Promise.all([
    fetch(`${base}/DejaVuSans.ttf`),
    fetch(`${base}/DejaVuSans-Bold.ttf`),
  ]);
  if (!regularRes.ok || !boldRes.ok) {
    throw new Error("Could not load PDF export fonts (DejaVu Sans). Hebrew requires a custom TTF.");
  }
  const [regular, bold] = await Promise.all([regularRes.arrayBuffer(), boldRes.arrayBuffer()]);
  fontCache = { regular, bold };
  return {
    regular: regular.slice(0),
    bold: bold.slice(0),
  };
}

export async function loadOriginalPageSizes(
  source: Uint8Array,
  password?: string,
): Promise<Array<{ width: number; height: number }>> {
  const { PDFDocument } = await import("pdf-lib-with-encrypt");
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  const pwd = password?.trim() || undefined;
  let doc;
  try {
    doc = await PDFDocument.load(copy, pwd ? { password: pwd } : {});
  } catch {
    doc = await PDFDocument.load(copy, { ignoreEncryption: true });
  }
  return doc.getPages().map((page) => {
    const { width, height } = page.getSize();
    return { width, height };
  });
}

export function exportPdfFromPagesInWorker(
  pages: PdfEditorPageExport[],
  handlers: {
    onProgress: (percent: number, status: string) => void;
    onComplete: (bytes: Uint8Array) => void;
    onError: (message: string) => void;
  },
): { cancel: () => void } {
  const worker = new Worker(new URL("../workers/pdf-editor-export.worker.ts", import.meta.url), {
    type: "module",
  });

  let cancelled = false;

  void (async () => {
    try {
      const fonts = await loadExportFonts();
      if (cancelled) return;

      const payload: PdfEditorExportRequest = {
        type: "export",
        pages,
        fontRegular: fonts.regular,
        fontBold: fonts.bold,
      };

      worker.onmessage = (event: MessageEvent<PdfEditorExportResponse>) => {
        const data = event.data;
        if (data.type === "progress") {
          handlers.onProgress(data.percent, data.status);
          return;
        }
        if (data.type === "ok") {
          worker.terminate();
          handlers.onComplete(new Uint8Array(data.buffer));
          return;
        }
        if (data.type === "error") {
          worker.terminate();
          handlers.onError(data.message);
        }
      };

      worker.onerror = (error) => {
        worker.terminate();
        handlers.onError(error.message || "PDF export worker failed.");
      };

      try {
        // Copy font buffers into the message; do not transfer so retries remain possible.
        worker.postMessage(payload);
      } catch (error) {
        worker.terminate();
        handlers.onError(
          error instanceof Error ? error.message : "Failed to start PDF export worker.",
        );
      }
    } catch (error) {
      worker.terminate();
      handlers.onError(error instanceof Error ? error.message : "Failed to prepare PDF export.");
    }
  })();

  return {
    cancel: () => {
      cancelled = true;
      worker.terminate();
    },
  };
}

/** @deprecated Use exportPdfFromPagesInWorker */
export function exportPdfFromBlocksInWorker(
  blocks: PdfEditorBlock[],
  handlers: {
    onProgress: (percent: number, status: string) => void;
    onComplete: (bytes: Uint8Array) => void;
    onError: (message: string) => void;
  },
): { cancel: () => void } {
  return exportPdfFromPagesInWorker(
    [{ pageIndex: 0, width: 612, height: 792, blocks }],
    handlers,
  );
}
