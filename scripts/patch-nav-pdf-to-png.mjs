/**
 * Inserts PDF → PNG link in Convert dropdown after PDF → JPG on all HTML pages.
 */
import { readFile, writeFile, rename, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const NEEDLE =
  '<a class="nav-dropdown__item" href="/tools/pdf-to-jpg/" role="menuitem">PDF → JPG</a>';
const INSERT =
  `${NEEDLE}
            <a class="nav-dropdown__item" href="/tools/pdf-to-png/" role="menuitem">PDF → PNG</a>`;

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
    if (!html.includes(NEEDLE) || html.includes("/tools/pdf-to-png/")) {
      skipped++;
      continue;
    }
    const next = html.replaceAll(NEEDLE, INSERT);
    await atomicWrite(file, next);
    updated++;
  }

  console.log(`PDF→PNG nav patch: ${updated} updated, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
