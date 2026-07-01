import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type HtmlMarkdownConverterMode = "markdown-to-html" | "html-to-markdown";

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

type MarkedParser = {
  use: (options: object) => void;
  parse: (markdown: string) => string | Promise<string>;
};

type TurndownInstance = {
  turndown: (html: string) => string;
};

let markedReady: Promise<MarkedParser> | null = null;
let turndownReady: Promise<TurndownInstance> | null = null;

async function getMarked() {
  if (!markedReady) {
    markedReady = import("marked").then(({ marked }) => {
      marked.use({ gfm: true, breaks: true });
      return marked;
    });
  }
  return markedReady;
}

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

export async function convertMarkdownToHtml(markdown: string): Promise<ConverterResult> {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return { ok: true, output: "" };
  }

  try {
    const marked = await getMarked();
    const html = await marked.parse(trimmed);
    return { ok: true, output: typeof html === "string" ? html : "" };
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
