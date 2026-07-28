/**
 * Static scan: collect /tools/... hrefs from key link sources and verify
 * route folders / catch-all coverage exist.
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const toolsApp = path.join(root, "src/app/[locale]/tools");

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(full, acc);
    else if (/\.(ts|tsx|js|mjs|cjs|json)$/.test(e.name)) acc.push(full);
  }
  return acc;
}

const files = [
  ...walkFiles(path.join(root, "src/lib")),
  ...walkFiles(path.join(root, "src/data")),
  ...walkFiles(path.join(root, "src/components")).filter((f) =>
    /Directory|Footer|Header|Mega|Nav|sitemap|HomeHero|Related/i.test(f),
  ),
  path.join(root, "src/app/sitemap.ts"),
];

const hrefs = new Map(); // path -> files
const re = /["'`](\/(?:en|he|ru)?\/?tools\/[a-zA-Z0-9\-\/_]+)["'`]/g;

for (const file of files) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  let m;
  while ((m = re.exec(text))) {
    let p = m[1].replace(/^\/(en|he|ru)/, "") || m[1];
    if (!p.startsWith("/")) p = `/${p}`;
    if (!p.endsWith("/")) p += "/";
    // skip templates
    if (p.includes("${") || p.includes("[slug]") || p.includes("...")) continue;
    const list = hrefs.get(p) || [];
    list.push(path.relative(root, file));
    hrefs.set(p, list);
  }
}

function existsRoute(toolPath) {
  // /tools/foo/ or /tools/hub/foo/
  const parts = toolPath.replace(/^\/tools\//, "").replace(/\/$/, "").split("/").filter(Boolean);
  if (parts.length === 0) return { ok: true, via: "tools-index" };
  if (parts.length === 1) {
    const slug = parts[0];
    if (fs.existsSync(path.join(toolsApp, slug, "page.tsx"))) return { ok: true, via: "dedicated-or-hub" };
    if (fs.existsSync(path.join(toolsApp, "[slug]", "page.tsx"))) return { ok: true, via: "flat-catchall-maybe" };
    return { ok: false, reason: "no flat page" };
  }
  if (parts.length === 2) {
    const [hub, slug] = parts;
    if (fs.existsSync(path.join(toolsApp, hub, slug, "page.tsx"))) return { ok: true, via: "nested-dedicated" };
    if (fs.existsSync(path.join(toolsApp, hub, "[slug]", "page.tsx"))) return { ok: true, via: "hub-catchall" };
    if (fs.existsSync(path.join(toolsApp, slug, "page.tsx"))) return { ok: true, via: "flat-dedicated-fallback" };
    return { ok: false, reason: `no page for ${hub}/${slug} and no ${hub}/[slug]` };
  }
  return { ok: false, reason: "unexpected depth" };
}

const risky = [];
for (const [p, sources] of [...hrefs.entries()].sort()) {
  const r = existsRoute(p);
  if (!r.ok) risky.push({ path: p, ...r, sources: [...new Set(sources)].slice(0, 5) });
}

console.log(`Scanned hardcoded tool paths: ${hrefs.size}`);
console.log(`Structurally missing routes: ${risky.length}\n`);
for (const r of risky) {
  console.log(`- ${r.path}`);
  console.log(`  reason: ${r.reason}`);
  console.log(`  seen in: ${r.sources.join(", ")}`);
}

fs.writeFileSync(
  path.join(root, "scripts/tool-404-static-hrefs.json"),
  JSON.stringify({ total: hrefs.size, risky }, null, 2),
);
console.log("\nWrote scripts/tool-404-static-hrefs.json");
