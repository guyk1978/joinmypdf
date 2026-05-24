/**
 * Replaces flat main-nav with categorized dropdown navigation.
 */
import { readFile, writeFile, rename, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { injectSiteNav } from "./lib/site-nav-html.mjs";
import { loadMergedBlogRegistry } from "./lib/merge-blog-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

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
  const blog = await loadMergedBlogRegistry({ root, readFile });
  const files = [];
  await walkHtml(root, files);
  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const html = await readFile(file, "utf8");
    const result = injectSiteNav(html, blog.blog);
    if (!result.ok) {
      skipped++;
      continue;
    }
    await atomicWrite(file, result.html);
    updated++;
  }

  console.log(`Site nav patch: ${updated} updated, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
