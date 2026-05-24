/**
 * Enables Protect PDF nav link across static HTML pages.
 */
import { readFile, writeFile, rename, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const OLD_PROTECT =
  /<span class="nav-dropdown__item nav-dropdown__item--soon" role="menuitem" aria-disabled="true"><span>Protect PDF<\/span><span class="nav-dropdown__badge">Coming soon<\/span><\/span>/g;

const NEW_PROTECT =
  '<a class="nav-dropdown__item" href="/tools/protect-pdf/" role="menuitem">Protect PDF</a>';

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
  for (const file of files) {
    const html = await readFile(file, "utf8");
    if (!OLD_PROTECT.test(html)) continue;
    const next = html.replace(OLD_PROTECT, NEW_PROTECT);
    await atomicWrite(file, next);
    updated++;
  }
  console.log(`Protect nav link patch: ${updated} updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
