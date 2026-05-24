/**
 * Unified theme patch: brand, nav (with full Guides list), centered dropzones, site-nav.js.
 */
import { readFile, writeFile, rename, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { injectSiteHeader } from "./lib/site-nav-html.mjs";
import { BRAND_BLOCK_RE, buildBrandHtml } from "./lib/brand-html.mjs";
import { normalizeDropzoneInHtml } from "./lib/dropzone-html.mjs";
import { loadMergedBlogRegistry } from "./lib/merge-blog-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const PATCH_ROOTS = [
  "tools",
  "blog",
  "compare",
  "privacy-first-pdf-tools",
  "privacy",
  path.join("blog", "template"),
].map((d) => path.join(root, d));

const SITE_NAV_SCRIPT = '<script src="/assets/js/site-nav.js" defer></script>';

async function walkHtml(dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      await walkHtml(full, out);
    } else if (e.isFile() && e.name.toLowerCase() === "index.html") {
      out.push(full);
    }
  }
}

async function atomicWrite(filePath, content) {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, content, "utf8");
  await rename(tmp, filePath);
}

function ensureStylesheet(html) {
  if (/\/assets\/css\/styles\.css/.test(html)) return html;
  return html.replace(
    /<\/head>/i,
    '    <link rel="stylesheet" href="/assets/css/styles.css" />\n  </head>'
  );
}

function ensureSiteNavScript(html) {
  if (html.includes("/assets/js/site-nav.js")) return html;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `    ${SITE_NAV_SCRIPT}\n  </body>`);
  }
  return html + `\n${SITE_NAV_SCRIPT}\n`;
}

function patchBrandOnly(html) {
  if (!BRAND_BLOCK_RE.test(html)) return html;
  return html.replace(BRAND_BLOCK_RE, buildBrandHtml("/"));
}

async function main() {
  const blog = await loadMergedBlogRegistry({ root, readFile });
  const files = [];
  for (const dir of PATCH_ROOTS) {
    await walkHtml(dir, files);
  }

  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    let html = await readFile(file, "utf8");
    const before = html;

    html = ensureStylesheet(html);
    html = patchBrandOnly(html);

    const headerResult = injectSiteHeader(html, blog.blog);
    if (headerResult.ok) html = headerResult.html;

    html = normalizeDropzoneInHtml(html);
    html = ensureSiteNavScript(html);

    if (html !== before) {
      await atomicWrite(file, html);
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(
    `Unified theme patch: ${updated} updated, ${skipped} unchanged (${files.length} scanned, ${blog.blog.length} blog posts in Guides).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
