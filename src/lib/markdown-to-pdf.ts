import { classifyPdfError } from "./pdf-errors";

export type MarkdownTheme = "github" | "academic" | "minimal-dark";

export type MarkdownProgressPhase = "parsing" | "rendering" | "building";

export const MARKDOWN_THEMES: { id: MarkdownTheme; label: string }[] = [
  { id: "github", label: "GitHub Markdown" },
  { id: "academic", label: "Academic Clean" },
  { id: "minimal-dark", label: "Minimal Dark" },
];

const RENDER_ROOT_ID = "joinmypdf-markdown-to-pdf-render-root";
const A4_CONTENT_WIDTH_PX = 794;

export const DEFAULT_MARKDOWN_SAMPLE = `# Markdown to PDF

Write **bold**, *italic*, and \`inline code\` in your browser.

## Features

- Headers and lists
- Tables and blockquotes
- Fenced code blocks

\`\`\`typescript
function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

| Column | Value |
| ------ | ----- |
| Privacy | 100% client-side |
| Upload | Never leaves your device |
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function themeStyles(theme: MarkdownTheme): string {
  if (theme === "academic") {
    return `
      .joinmypdf-md-render {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 12pt;
        line-height: 1.65;
        color: #1a1a1a;
        background: #ffffff;
      }
      .joinmypdf-md-render h1 { font-size: 1.85em; margin: 0 0 0.65em; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25em; }
      .joinmypdf-md-render h2 { font-size: 1.45em; margin: 1.25em 0 0.5em; font-weight: 700; }
      .joinmypdf-md-render h3 { font-size: 1.2em; margin: 1em 0 0.45em; font-weight: 700; }
      .joinmypdf-md-render p { margin: 0 0 0.9em; }
      .joinmypdf-md-render ul, .joinmypdf-md-render ol { margin: 0 0 0.9em 1.35em; }
      .joinmypdf-md-render blockquote { margin: 0 0 1em; padding: 0.35em 1em; border-left: 4px solid #94a3b8; color: #475569; font-style: italic; }
      .joinmypdf-md-render pre { margin: 0 0 1em; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; overflow-x: auto; }
      .joinmypdf-md-render code { font-family: "Courier New", Courier, monospace; font-size: 0.92em; }
      .joinmypdf-md-render :not(pre) > code { background: #f1f5f9; padding: 0.12em 0.35em; border-radius: 3px; }
      .joinmypdf-md-render table { border-collapse: collapse; width: 100%; margin: 0 0 1em; font-size: 11pt; }
      .joinmypdf-md-render th, .joinmypdf-md-render td { border: 1px solid #94a3b8; padding: 8px 10px; text-align: left; vertical-align: top; }
      .joinmypdf-md-render th { background: #f1f5f9; font-weight: 700; }
      .joinmypdf-md-render a { color: #1e40af; text-decoration: underline; }
      .joinmypdf-md-render hr { border: none; border-top: 1px solid #cbd5e1; margin: 1.5em 0; }
    `;
  }

  if (theme === "minimal-dark") {
    return `
      .joinmypdf-md-render {
        font-family: "Segoe UI", system-ui, sans-serif;
        font-size: 11.5pt;
        line-height: 1.55;
        color: #e6edf3;
        background: #0d1117;
      }
      .joinmypdf-md-render h1 { font-size: 1.75em; margin: 0 0 0.6em; font-weight: 600; color: #f0f6fc; }
      .joinmypdf-md-render h2 { font-size: 1.35em; margin: 1.1em 0 0.5em; font-weight: 600; color: #f0f6fc; }
      .joinmypdf-md-render h3 { font-size: 1.12em; margin: 0.9em 0 0.4em; font-weight: 600; color: #c9d1d9; }
      .joinmypdf-md-render p { margin: 0 0 0.85em; color: #c9d1d9; }
      .joinmypdf-md-render ul, .joinmypdf-md-render ol { margin: 0 0 0.85em 1.25em; color: #c9d1d9; }
      .joinmypdf-md-render blockquote { margin: 0 0 1em; padding: 0.35em 1em; border-left: 3px solid #30363d; color: #8b949e; }
      .joinmypdf-md-render pre { margin: 0 0 1em; padding: 14px 16px; background: #161b22; border: 1px solid #30363d; border-radius: 6px; overflow-x: auto; }
      .joinmypdf-md-render code { font-family: ui-monospace, "Cascadia Code", Consolas, monospace; font-size: 0.9em; color: #ff7b72; }
      .joinmypdf-md-render :not(pre) > code { background: #21262d; padding: 0.15em 0.4em; border-radius: 4px; color: #79c0ff; }
      .joinmypdf-md-render table { border-collapse: collapse; width: 100%; margin: 0 0 1em; }
      .joinmypdf-md-render th, .joinmypdf-md-render td { border: 1px solid #30363d; padding: 8px 10px; text-align: left; }
      .joinmypdf-md-render th { background: #161b22; color: #f0f6fc; }
      .joinmypdf-md-render a { color: #58a6ff; text-decoration: underline; }
      .joinmypdf-md-render hr { border: none; border-top: 1px solid #30363d; margin: 1.5em 0; }
    `;
  }

  return `
    .joinmypdf-md-render {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #24292f;
      background: #ffffff;
    }
    .joinmypdf-md-render h1 { font-size: 2em; margin: 0 0 0.5em; padding-bottom: 0.3em; border-bottom: 1px solid #d0d7de; font-weight: 600; }
    .joinmypdf-md-render h2 { font-size: 1.5em; margin: 1.25em 0 0.5em; padding-bottom: 0.25em; border-bottom: 1px solid #d0d7de; font-weight: 600; }
    .joinmypdf-md-render h3 { font-size: 1.25em; margin: 1em 0 0.45em; font-weight: 600; }
    .joinmypdf-md-render p { margin: 0 0 1em; }
    .joinmypdf-md-render ul, .joinmypdf-md-render ol { margin: 0 0 1em 1.5em; padding: 0; }
    .joinmypdf-md-render blockquote { margin: 0 0 1em; padding: 0 1em; color: #57606a; border-left: 4px solid #d0d7de; }
    .joinmypdf-md-render pre { margin: 0 0 1em; padding: 16px; background: #f6f8fa; border-radius: 6px; overflow-x: auto; border: 1px solid #d0d7de; }
    .joinmypdf-md-render pre code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.9em; color: #24292f; background: transparent; }
    .joinmypdf-md-render :not(pre) > code { background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 6px; font-family: ui-monospace, Consolas, monospace; font-size: 0.9em; }
    .joinmypdf-md-render table { border-collapse: collapse; width: 100%; margin: 0 0 1em; }
    .joinmypdf-md-render th, .joinmypdf-md-render td { border: 1px solid #d0d7de; padding: 8px 13px; }
    .joinmypdf-md-render th { background: #f6f8fa; font-weight: 600; }
    .joinmypdf-md-render tr:nth-child(even) td { background: #f6f8fa; }
    .joinmypdf-md-render a { color: #0969da; text-decoration: underline; }
    .joinmypdf-md-render hr { border: none; border-top: 1px solid #d0d7de; margin: 1.5em 0; }
  `;
}

export async function parseMarkdownToHtml(markdown: string): Promise<string> {
  const trimmed = markdown.trim();
  if (!trimmed) {
    throw new Error("Add some Markdown text or upload a .md file first.");
  }

  const { marked } = await import("marked");

  marked.use({
    gfm: true,
    breaks: true,
    renderer: {
      code({ text, lang }) {
        const language = lang ? escapeHtml(lang) : "";
        const label = language ? `<span class="code-lang">${language}</span>` : "";
        return `<pre class="code-block">${label}<code>${escapeHtml(text)}</code></pre>`;
      },
    },
  });

  const html = marked.parse(trimmed);
  return typeof html === "string" ? html : await html;
}

export function previewSurfaceClass(theme: MarkdownTheme): string {
  if (theme === "minimal-dark") {
    return "rounded-xl border border-white/10 bg-[#0d1117] p-4 md:p-6 text-[#c9d1d9]";
  }
  if (theme === "academic") {
    return "rounded-xl border border-white/10 bg-white p-4 md:p-6 text-slate-900";
  }
  return "rounded-xl border border-white/10 bg-white p-4 md:p-6 text-[#24292f]";
}

function buildRenderHost(html: string, theme: MarkdownTheme): HTMLElement {
  const existing = document.getElementById(RENDER_ROOT_ID);
  existing?.remove();

  const host = document.createElement("div");
  host.id = RENDER_ROOT_ID;
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = `${A4_CONTENT_WIDTH_PX}px`;
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";

  const inner = document.createElement("div");
  inner.className = "joinmypdf-md-render";
  inner.style.width = `${A4_CONTENT_WIDTH_PX}px`;
  inner.style.padding = "48px 56px";
  inner.style.boxSizing = "border-box";
  inner.innerHTML = html;

  const style = document.createElement("style");
  style.textContent = `
    ${themeStyles(theme)}
    .joinmypdf-md-render .code-lang {
      display: block;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 6px;
      opacity: 0.7;
    }
    .joinmypdf-md-render img { max-width: 100%; height: auto; }
  `;

  host.appendChild(style);
  host.appendChild(inner);
  document.body.appendChild(host);
  return inner;
}

async function htmlElementToPdfBlob(element: HTMLElement): Promise<Blob> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const renderShell = element.closest(".joinmypdf-md-render");
  const bg =
    (renderShell instanceof HTMLElement ? renderShell.style.backgroundColor : "") ||
    getComputedStyle(element).backgroundColor ||
    "#ffffff";

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: bg === "rgba(0, 0, 0, 0)" ? "#ffffff" : bg,
    logging: false,
  });

  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
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

export async function readMarkdownFile(file: File): Promise<string> {
  if (!/\.md$/i.test(file.name) && !/markdown/i.test(file.type)) {
    throw new Error("Please upload a .md Markdown file.");
  }
  const text = await file.text();
  if (!text.trim()) {
    throw new Error("That Markdown file is empty.");
  }
  return text;
}

export async function convertMarkdownToPdf(
  markdown: string,
  theme: MarkdownTheme,
  onProgress?: (phase: MarkdownProgressPhase) => void,
): Promise<Blob> {
  onProgress?.("parsing");

  try {
    const html = await parseMarkdownToHtml(markdown);
    if (!html.trim()) {
      throw new Error("Nothing to render. Add Markdown content first.");
    }

    onProgress?.("rendering");
    const renderRoot = buildRenderHost(html, theme);

    try {
      onProgress?.("building");
      return await htmlElementToPdfBlob(renderRoot);
    } finally {
      renderRoot.parentElement?.remove();
    }
  } catch (error) {
    throw classifyPdfError(error);
  }
}

export function markdownToPdfOutputName(file: File | null, titleHint?: string): string {
  if (file) {
    const base = file.name.replace(/\.md$/i, "") || "document";
    const slug = base.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
    return `joinmypdf-${slug}.pdf`;
  }
  const fromTitle = (titleHint || "markdown-notes")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `joinmypdf-${fromTitle || "markdown"}.pdf`;
}