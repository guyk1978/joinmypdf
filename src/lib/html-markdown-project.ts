import JSZip from "jszip";
import type { ConverterResult, MarkdownFlavor } from "@/lib/html-markdown-converter";
import { convertHtmlToMarkdown, convertMarkdownToHtml, minifyHtmlOutput } from "@/lib/html-markdown-converter";

export const HTML_MD_CONFIG_KEY = "joinmypdf-html-md-project-config";

export type HtmlMarkdownProjectConfig = {
  flavor: MarkdownFlavor;
  minifyHtml: boolean;
  includeCssBoilerplate: boolean;
  syncScroll: boolean;
};

export const DEFAULT_PROJECT_CONFIG: HtmlMarkdownProjectConfig = {
  flavor: "gfm",
  minifyHtml: false,
  includeCssBoilerplate: true,
  syncScroll: true,
};

/** Semantic CSS boilerplate for converted HTML in project pages. */
export const PROJECT_CSS_BOILERPLATE = `.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: inherit;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  margin: 0 0 0.65em;
  font-weight: 600;
  line-height: 1.25;
}
.markdown-body h1 { font-size: 1.75rem; }
.markdown-body h2 { font-size: 1.35rem; margin-top: 1.25em; }
.markdown-body h3 { font-size: 1.125rem; margin-top: 1em; }
.markdown-body p { margin: 0 0 0.85em; }
.markdown-body ul, .markdown-body ol { margin: 0 0 0.85em 1.35em; padding: 0; }
.markdown-body blockquote {
  margin: 0 0 1em;
  padding: 0.35em 1em;
  border-left: 3px solid currentColor;
  opacity: 0.85;
}
.markdown-body pre {
  margin: 0 0 1em;
  padding: 0.875rem 1rem;
  overflow-x: auto;
  border-radius: 0.375rem;
}
.markdown-body code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
}
.markdown-body a { text-decoration: underline; }
.markdown-body table { border-collapse: collapse; width: 100%; margin: 0 0 1em; }
.markdown-body th, .markdown-body td { border: 1px solid currentColor; padding: 0.5rem 0.625rem; }
`;

export function loadProjectConfig(): HtmlMarkdownProjectConfig {
  if (typeof window === "undefined") return DEFAULT_PROJECT_CONFIG;
  try {
    const raw = window.localStorage.getItem(HTML_MD_CONFIG_KEY);
    if (!raw) return DEFAULT_PROJECT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<HtmlMarkdownProjectConfig>;
    return {
      flavor: parsed.flavor === "commonmark" ? "commonmark" : "gfm",
      minifyHtml: Boolean(parsed.minifyHtml),
      includeCssBoilerplate: parsed.includeCssBoilerplate !== false,
      syncScroll: parsed.syncScroll !== false,
    };
  } catch {
    return DEFAULT_PROJECT_CONFIG;
  }
}

export function saveProjectConfig(config: HtmlMarkdownProjectConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HTML_MD_CONFIG_KEY, JSON.stringify(config));
  } catch {
    /* non-fatal */
  }
}

export function buildCopyToProjectSnippet(
  html: string,
  config: Pick<HtmlMarkdownProjectConfig, "minifyHtml" | "includeCssBoilerplate">,
): string {
  const body = config.minifyHtml ? minifyHtmlOutput(html) : html.trim();
  if (!config.includeCssBoilerplate) {
    return `<div class="markdown-body">\n${body}\n</div>`;
  }

  return `<!-- Copy into your project: wrap content + add CSS -->\n<style>\n${PROJECT_CSS_BOILERPLATE}\n</style>\n<div class="markdown-body">\n${body}\n</div>`;
}

export type BatchConvertResult = {
  name: string;
  outputName: string;
  output: string;
  error?: string;
};

function outputExtension(inputName: string, direction: "md-to-html" | "html-to-md"): string {
  if (direction === "md-to-html") {
    return inputName.replace(/\.(md|markdown)$/i, ".html");
  }
  return inputName.replace(/\.(html|htm)$/i, ".md");
}

export async function batchConvertFiles(
  files: File[],
  direction: "md-to-html" | "html-to-md",
  config: HtmlMarkdownProjectConfig,
): Promise<BatchConvertResult[]> {
  const results: BatchConvertResult[] = [];

  for (const file of files) {
    const text = await file.text();
    const lower = file.name.toLowerCase();
    let converted: ConverterResult;

    if (direction === "md-to-html") {
      if (!/\.(md|markdown)$/.test(lower)) {
        results.push({
          name: file.name,
          outputName: file.name,
          output: "",
          error: "Skipped — not a Markdown file.",
        });
        continue;
      }
      converted = await convertMarkdownToHtml(text, { flavor: config.flavor });
    } else {
      if (!/\.(html|htm)$/.test(lower)) {
        results.push({
          name: file.name,
          outputName: file.name,
          output: "",
          error: "Skipped — not an HTML file.",
        });
        continue;
      }
      converted = await convertHtmlToMarkdown(text);
    }

    if (!converted.ok) {
      results.push({
        name: file.name,
        outputName: outputExtension(file.name, direction),
        output: "",
        error: converted.error,
      });
      continue;
    }

    let output = converted.output;
    if (direction === "md-to-html" && config.minifyHtml) {
      output = minifyHtmlOutput(output);
    }

    results.push({
      name: file.name,
      outputName: outputExtension(file.name, direction),
      output,
    });
  }

  return results;
}

export async function downloadBatchZip(results: BatchConvertResult[]): Promise<void> {
  const zip = new JSZip();
  let added = 0;

  for (const item of results) {
    if (!item.output || item.error) continue;
    zip.file(item.outputName, item.output);
    added += 1;
  }

  if (added === 0) return;

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "converted-files.zip";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function openGistEditor(): void {
  window.open("https://gist.github.com/", "_blank", "noopener,noreferrer");
}

export function buildGistClipboardPayload(markdown: string, fileName = "draft.md"): string {
  return markdown.trim() ? markdown : `# ${fileName}\n\n`;
}
