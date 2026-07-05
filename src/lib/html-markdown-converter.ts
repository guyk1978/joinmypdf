import { downloadTextFile } from "@/lib/data-tool/converter";
import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type HtmlMarkdownConverterMode = "markdown-to-html" | "html-to-markdown";
export type MarkdownFlavor = "gfm" | "commonmark";

export type ConverterResult =
  | { ok: true; output: string }
  | { ok: false; error: string };

export const DEFAULT_MARKDOWN_SAMPLE = `# Hello Markdown

Write **bold**, *italic*, and \`inline code\`.

## List

- First item
- Second item

> A blockquote

[Link](https://example.com)
`;

type TurndownInstance = {
  turndown: (html: string) => string;
};

let turndownReady: Promise<TurndownInstance> | null = null;

async function getTurndown() {
  if (!turndownReady) {
    turndownReady = import("turndown").then(({ default: TurndownService }) => {
      return new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        bulletListMarker: "-",
      });
    });
  }
  return turndownReady;
}

async function parseMarkdown(markdown: string, flavor: MarkdownFlavor): Promise<string> {
  const { Marked } = await import("marked");
  const parser = new Marked({
    gfm: flavor === "gfm",
    breaks: flavor === "gfm",
  });
  const html = await parser.parse(markdown);
  return typeof html === "string" ? html : "";
}

export async function convertMarkdownToHtml(
  markdown: string,
  options: { flavor?: MarkdownFlavor } = {},
): Promise<ConverterResult> {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return { ok: true, output: "" };
  }

  try {
    const html = await parseMarkdown(trimmed, options.flavor ?? "gfm");
    return { ok: true, output: html };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not convert Markdown to HTML.";
    return { ok: false, error: message };
  }
}

export async function convertHtmlToMarkdown(html: string): Promise<ConverterResult> {
  const trimmed = html.trim();
  if (!trimmed) {
    return { ok: true, output: "" };
  }

  try {
    const turndown = await getTurndown();
    const markdown = turndown.turndown(trimmed);
    return { ok: true, output: markdown };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not convert HTML to Markdown.";
    return { ok: false, error: message };
  }
}

const PREVIEW_STYLES = `
  body {
    margin: 0;
    padding: 1rem 1.125rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: #e5e5e5;
    background: #141417;
  }
  h1, h2, h3, h4, h5, h6 { color: #f4f4f5; margin: 0 0 0.65em; font-weight: 600; }
  h1 { font-size: 1.75rem; }
  h2 { font-size: 1.35rem; margin-top: 1.25em; }
  h3 { font-size: 1.125rem; margin-top: 1em; }
  p { margin: 0 0 0.85em; }
  ul, ol { margin: 0 0 0.85em 1.35em; padding: 0; }
  blockquote {
    margin: 0 0 1em;
    padding: 0.35em 1em;
    border-left: 3px solid #52525b;
    color: #a1a1aa;
  }
  pre {
    margin: 0 0 1em;
    padding: 0.875rem 1rem;
    background: #0d0d0f;
    border: 1px solid #3f3f46;
    border-radius: 0.375rem;
    overflow-x: auto;
  }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
  }
  :not(pre) > code {
    background: #27272a;
    padding: 0.12em 0.35em;
    border-radius: 0.25rem;
    color: #93c5fd;
  }
  a { color: #60a5fa; }
  table { border-collapse: collapse; width: 100%; margin: 0 0 1em; }
  th, td { border: 1px solid #3f3f46; padding: 0.5rem 0.625rem; text-align: left; }
  th { background: #1f1f23; }
  hr { border: none; border-top: 1px solid #3f3f46; margin: 1.25em 0; }
`;

export function buildHtmlPreviewDocument(html: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PREVIEW_STYLES}</style></head><body>${html}</body></html>`;
}

/** Minimal semantic HTML5 document for export — no inline styles on content nodes. */
export function buildProductionHtmlDocument(html: string, title = "Document"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title.replace(/[<>&"]/g, "")}</title>
</head>
<body>
${html}
</body>
</html>
`;
}

export function downloadHtmlExport(html: string, fileName = "document.html"): void {
  if (!html.trim()) return;
  downloadTextFile(buildProductionHtmlDocument(html), fileName, "text/html;charset=utf-8");
}

export function downloadMarkdownExport(markdown: string, fileName = "document.md"): void {
  if (!markdown.trim()) return;
  downloadTextFile(markdown, fileName, "text/markdown;charset=utf-8");
}

/** Collapse inter-tag whitespace for compact HTML export (preserves pre/code blocks roughly). */
export function minifyHtmlOutput(html: string): string {
  return html
    .split(/(<pre[\s\S]*?<\/pre>)/gi)
    .map((part, index) => {
      if (index % 2 === 1) return part;
      return part.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
    })
    .join("")
    .trim();
}

export const HTML_MD_STORAGE_KEY = "joinmypdf-html-markdown-converter";

export type HtmlMarkdownPersistedState = {
  mode: HtmlMarkdownConverterMode;
  flavor: MarkdownFlavor;
  markdown: string;
  html: string;
  syncScroll?: boolean;
};

/** Proportional scroll sync for two-pane editors (lightweight, no layout reads beyond scroll metrics). */
export function syncProportionalScroll(source: HTMLElement, target: HTMLElement): void {
  const sourceMax = source.scrollHeight - source.clientHeight;
  const targetMax = target.scrollHeight - target.clientHeight;
  if (sourceMax <= 0 || targetMax <= 0) return;
  target.scrollTop = (source.scrollTop / sourceMax) * targetMax;
}

export function loadHtmlMarkdownState(): HtmlMarkdownPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HTML_MD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HtmlMarkdownPersistedState;
    if (typeof parsed.markdown !== "string" || typeof parsed.html !== "string") return null;
    return {
      ...parsed,
      syncScroll: parsed.syncScroll !== false,
    };
  } catch {
    return null;
  }
}

export function saveHtmlMarkdownState(state: HtmlMarkdownPersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HTML_MD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Quota or private mode — non-fatal */
  }
}

export function clearHtmlMarkdownState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HTML_MD_STORAGE_KEY);
  } catch {
    /* non-fatal */
  }
}
