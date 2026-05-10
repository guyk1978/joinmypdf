/**
 * Injects the MapDiagram cross-site footer link into all HTML pages with class site-footer.
 * Uses atomic writes. Idempotent (skips if already present).
 */
import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const LINK_HTML =
  '<p class="site-footer__cross"><a href="https://mapdiagram.com/" rel="noopener noreferrer" target="_blank">Visualize your ideas → MapDiagram</a></p>';

const SENTINEL = "mapdiagram.com";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

async function walkHtml(dir, out) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
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

function injectIntoSiteFooter(html) {
  const re =
    /(<footer\b[^>]*class="[^"]*site-footer[^"]*"[^>]*>\s*<div\s+class="container">)([\s\S]*?)(<\/div>\s*<\/footer>)/i;
  const m = html.match(re);
  if (!m) return { ok: false, reason: "no-site-footer-block", html };
  const inner = m[2];
  if (inner.includes(SENTINEL)) return { ok: false, reason: "already-has-link", html };
  const next = html.replace(re, `$1$2${LINK_HTML}$3`);
  return { ok: true, reason: "patched", html: next };
}

function injectAdminFooter(html, filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (!normalized.endsWith("/admin/seo-approval-dashboard.html")) {
    return { ok: false, reason: "not-admin-file", html };
  }
  if (html.includes(SENTINEL) && html.includes("site-footer__cross")) {
    return { ok: false, reason: "already-has-link", html };
  }
  if (/<footer\b[^>]*class="[^"]*site-footer/i.test(html)) {
    return { ok: false, reason: "admin-has-footer", html };
  }
  const block = `\n    <footer class="site-footer">\n      <div class="container">\n        ${LINK_HTML}\n      </div>\n    </footer>\n`;
  const idx = html.lastIndexOf("</body>");
  if (idx === -1) return { ok: false, reason: "no-body-close", html };
  return { ok: true, reason: "admin-footer-added", html: html.slice(0, idx) + block + html.slice(idx) };
}

async function main() {
  const files = [];
  await walkHtml(root, files);

  let applied = 0;
  let skipped = 0;
  const reasons = {};

  for (const filePath of files) {
    let before = await readFile(filePath, "utf8");
    if (before.includes(SENTINEL) && before.includes("site-footer__cross")) {
      skipped++;
      reasons.already = (reasons.already || 0) + 1;
      continue;
    }

    let result = injectIntoSiteFooter(before);
    if (!result.ok) {
      result = injectAdminFooter(before, filePath);
    }

    if (!result.ok) {
      skipped++;
      const r = result.reason || "unknown";
      reasons[r] = (reasons[r] || 0) + 1;
      continue;
    }

    if (dryRun) {
      applied++;
      console.log("[dry-run would patch]", path.relative(root, filePath));
      continue;
    }

    await atomicWrite(filePath, result.html);
    applied++;
    console.log("[patched]", path.relative(root, filePath));
  }

  console.log("");
  console.log(dryRun ? "Dry-run summary:" : "Summary:");
  console.log("  applied:", applied);
  console.log("  skipped:", skipped);
  console.log("  by reason:", JSON.stringify(reasons));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
