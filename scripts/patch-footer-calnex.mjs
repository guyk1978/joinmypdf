/**
 * Injects CalnexApp footer link into all site-footer HTML pages. Idempotent.
 */
import { readFile, writeFile, rename } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const CALNEX_LINK =
  '<a href="https://calnexapp.com/" target="_blank" rel="noopener noreferrer" style="color: #cbd5e1; text-decoration: none; margin-left: 10px;">Model Loan Repayments ➔ CalnexApp</a>';

const MAPDIAGRAM_BLOCK = `<div
          class="partner-mapdiagram"
          style="margin: 20px 0 0; max-width: 100%; padding: 15px; border: 1px solid rgba(56, 73, 99, 0.85); border-radius: 8px; background: rgba(15, 23, 42, 0.55); text-align: center; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);"
          aria-label="Partner tool: MapDiagram"
        >
          <p style="margin: 0 0 10px 0; color: #e5e7eb; font-size: 0.95rem; line-height: 1.5;">
            Creating a presentation or workflow? Build flowcharts &amp; system designs visually with
            <strong style="color: #f8fafc;">MapDiagram</strong>, then bring them here to merge.
          </p>
          <a
            href="https://mapdiagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            style="color: #38bdf8; text-decoration: none; font-weight: bold;"
            >Open MapDiagram editor →</a
          >
        </div>`;

const FOOTER_RE =
  /(<footer\b[^>]*class="[^"]*site-footer[^"]*"[^>]*>\s*<div\s+class="container">)([\s\S]*?)(<\/div>\s*<\/footer>)/i;

const TOOL_MAPDIAGRAM_MARKER = 'class="partner-mapdiagram"';

async function walkHtml(dir, out) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "out" || e.name === "src") continue;
      await walkHtml(full, out);
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".html")) {
      out.push(full);
    }
  }
}

async function atomicWrite(filePath, content) {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, content, "utf8");
  await rename(tmp, filePath);
}

function injectCalnex(html) {
  if (html.includes("calnexapp.com")) return { ok: false, reason: "has-calnex", html };
  const m = html.match(FOOTER_RE);
  if (!m) return { ok: false, reason: "no-footer", html };
  let inner = m[2];
  if (/<p[^>]*>[\s\S]*?<\/p>/i.test(inner)) {
    inner = inner.replace(/<\/p>/i, ` ${CALNEX_LINK}</p>`);
  } else {
    inner += `<p>${CALNEX_LINK}</p>`;
  }
  return { ok: true, reason: "calnex", html: html.replace(FOOTER_RE, `$1${inner}$3`) };
}

function injectToolMapDiagram(html, filePath) {
  const norm = filePath.replace(/\\/g, "/");
  if (!norm.includes("/tools/") || norm.endsWith("/index.html") === false) return { ok: false, reason: "not-tool", html };
  if (html.includes(TOOL_MAPDIAGRAM_MARKER)) return { ok: false, reason: "has-banner", html };
  if (!html.includes('class="dropzone"')) return { ok: false, reason: "no-dropzone", html };
  const re = /(<div id="previewGrid" class="preview-grid"><\/div>)(\s*)(<\/article>)/i;
  if (!re.test(html)) return { ok: false, reason: "no-article-end", html };
  return {
    ok: true,
    reason: "mapdiagram-tool",
    html: html.replace(re, `$1\n          ${MAPDIAGRAM_BLOCK}$2$3`),
  };
}

async function main() {
  const files = [];
  await walkHtml(root, files);
  let calnex = 0;
  let map = 0;
  let skip = 0;

  for (const filePath of files) {
    let html = await readFile(filePath, "utf8");
    let changed = false;

    const c = injectCalnex(html);
    if (c.ok) {
      html = c.html;
      calnex++;
      changed = true;
    }

    const m = injectToolMapDiagram(html, filePath);
    if (m.ok) {
      html = m.html;
      map++;
      changed = true;
    }

    if (changed) {
      await atomicWrite(filePath, html);
      console.log("[patched]", path.relative(root, filePath), c.ok ? "calnex" : "", m.ok ? "mapdiagram" : "");
    } else {
      skip++;
    }
  }

  console.log("\nSummary: calnex footers:", calnex, "tool mapdiagram:", map, "unchanged:", skip);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
