/**
 * Replaces legacy flat footer markup with the 4-column site-footer__directory layout.
 */
import { readFile, writeFile, rename } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSiteFooter } from "./lib/footer-directory-html.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const FOOTER_RE =
  /<footer\b[^>]*class="[^"]*site-footer[^"]*"[^>]*>[\s\S]*?<\/footer>/i;

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

async function main() {
  const files = [];
  await walkHtml(root, files);
  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const html = await readFile(file, "utf8");
    if (!FOOTER_RE.test(html)) {
      skipped++;
      continue;
    }
    const next = html.replace(FOOTER_RE, buildSiteFooter(file));
    if (next === html) {
      skipped++;
      continue;
    }
    await atomicWrite(file, next);
    updated++;
  }

  console.log(`Footer directory patch: ${updated} updated, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
