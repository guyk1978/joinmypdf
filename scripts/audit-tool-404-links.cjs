/**
 * Audit tool links that may 404: inventory + RU SEO slugs vs App Router pages
 * and catch-all static params coverage.
 *
 * Usage: node scripts/audit-tool-404-links.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const toolsApp = path.join(root, "src", "app", "[locale]", "tools");

function walkDirs(dir, base = "") {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const page = path.join(dir, entry.name, "page.tsx");
    if (fs.existsSync(page)) out.push(rel);
    out.push(...walkDirs(path.join(dir, entry.name), rel));
  }
  return out;
}

function loadInventoryIds() {
  const src = fs.readFileSync(path.join(root, "src/data/tools-inventory.ts"), "utf8");
  return [...src.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
}

function loadInventoryPaths() {
  const src = fs.readFileSync(path.join(root, "src/data/tools-inventory.ts"), "utf8");
  const entries = [];
  const blocks = src.split(/\{\s*\n\s*id:/).slice(1);
  for (const block of blocks) {
    const id = block.match(/^\s*"([^"]+)"/)?.[1];
    const p = block.match(/path:\s*"([^"]+)"/)?.[1];
    const primary = block.match(/primaryCategory:\s*"([^"]+)"/)?.[1];
    if (id && p) entries.push({ id, path: p, primaryCategory: primary });
  }
  return entries;
}

function loadRuMap() {
  const src = fs.readFileSync(path.join(root, "src/lib/locale-tool-slugs.ts"), "utf8");
  const map = {};
  for (const m of src.matchAll(/^\s*"([a-z0-9-]+)":\s*"([a-z0-9-]+)"/gm)) {
    map[m[1]] = m[2];
  }
  return map;
}

function loadHubSegments() {
  // From tool-hierarchy / inventory hubs — approximate via hub page folders ending with -tools
  const hubs = walkDirs(toolsApp).filter(
    (p) => !p.includes("/") && (p.endsWith("-tools") || p.endsWith("-converters") || p === "unit-converters"),
  );
  return hubs;
}

function hasDedicatedPage(slug) {
  return fs.existsSync(path.join(toolsApp, slug, "page.tsx"));
}

function hasHubSlugCatchAll(hubSegment) {
  return fs.existsSync(path.join(toolsApp, hubSegment, "[slug]", "page.tsx"));
}

function loadRegistrySlugs() {
  try {
    const json = JSON.parse(fs.readFileSync(path.join(root, "assets/data/tools.json"), "utf8"));
    const tools = json.tools || json;
    if (!Array.isArray(tools)) return new Set();
    return new Set(tools.map((t) => t.slug).filter(Boolean));
  } catch {
    return new Set();
  }
}

function loadAudioIds() {
  try {
    const src = fs.readFileSync(path.join(root, "src/data/tools.ts"), "utf8");
    // toolsList entries with id:
    return new Set([...src.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]));
  } catch {
    return new Set();
  }
}

// Hub segment mapping (mirror getCategoryHubSegment roughly)
const CATEGORY_TO_HUB = {
  pdf: "pdf-tools",
  video: "video-tools",
  mp4: "mp4-tools",
  convert: "convert-tools",
  compress: "compress-tools",
  extract: "extract-tools",
  image: "image-tools",
  jpg: "jpg-tools",
  png: "png-tools",
  mp3: "mp3-tools",
  audio: "mp3-tools",
  favicon: "favicon-tools",
  text: "text-tools",
  json: "json-tools",
  yaml: "yaml-tools",
  xml: "xml-tools",
  developer: "developer-tools",
  word: "word-tools",
  excel: "excel-tools",
  crop: "crop-tools",
  rotate: "rotate-tools",
  security: "security-tools",
  design: "image-tools",
  data: "data-conversion-tools",
  productivity: "productivity-tools",
  "unit-math": "unit-converters",
  network: "network-tools",
};

const inventory = loadInventoryPaths();
const ruMap = loadRuMap();
const registry = loadRegistrySlugs();
const audioIds = loadAudioIds();
const hubPages = new Set(loadHubSegments());
const dedicatedPages = new Set(
  walkDirs(toolsApp).filter((p) => !p.includes("[") && !p.endsWith("-tools") && p !== "unit-converters"),
);

const issues = [];

function canResolve(id, publicSlug, hub) {
  // Flat dedicated
  if (hasDedicatedPage(id) || hasDedicatedPage(publicSlug)) return { ok: true, via: "dedicated" };
  // Nested dedicated: hub/id
  if (hub && fs.existsSync(path.join(toolsApp, hub, id, "page.tsx"))) {
    return { ok: true, via: `nested-dedicated:${hub}/${id}` };
  }
  if (hub && publicSlug !== id && fs.existsSync(path.join(toolsApp, hub, publicSlug, "page.tsx"))) {
    return { ok: true, via: `nested-dedicated:${hub}/${publicSlug}` };
  }
  // Catch-all [slug] under hub
  if (hub && hasHubSlugCatchAll(hub)) {
    if (audioIds.has(id)) return { ok: true, via: `hub-catchall-audio:${hub}` };
    if (registry.has(id)) return { ok: true, via: `hub-catchall-registry:${hub}` };
    // Catch-all page may still notFound for unknown tools
    return {
      ok: false,
      reason: `Hub catch-all exists (${hub}/[slug]) but tool is neither registry nor audio — page will notFound()`,
    };
  }
  // Flat catch-all tools/[slug]
  if (audioIds.has(id) || registry.has(id)) {
    return { ok: true, via: "flat-catchall" };
  }
  return {
    ok: false,
    reason: "No dedicated page, not in registry, not audio — flat [slug] will notFound()",
  };
}

for (const entry of inventory) {
  const hub = CATEGORY_TO_HUB[entry.primaryCategory] || null;
  const ru = ruMap[entry.id] || entry.id;

  // EN nested href pattern used by resolveToolHref
  const enHref = hub ? `/tools/${hub}/${entry.id}/` : `/tools/${entry.id}/`;
  const ruHref = hub ? `/tools/${hub}/${ru}/` : `/tools/${ru}/`;

  const en = canResolve(entry.id, entry.id, hub);
  const ruRes = canResolve(entry.id, ru, hub);

  if (!en.ok) {
    issues.push({
      locale: "en",
      id: entry.id,
      href: enHref,
      inventoryPath: entry.path,
      primaryCategory: entry.primaryCategory,
      hub,
      problem: en.reason,
    });
  }
  if (!ruRes.ok) {
    issues.push({
      locale: "ru",
      id: entry.id,
      href: `/ru${ruHref}`,
      publicSlug: ru,
      inventoryPath: entry.path,
      primaryCategory: entry.primaryCategory,
      hub,
      problem: ruRes.reason,
    });
  }

  // Inventory path may still be flat /tools/id/ while site links nested
  if (entry.path && entry.path !== enHref && entry.path !== `/tools/${entry.id}/`) {
    // note mismatch only if path itself might 404
    const flatPathSlug = entry.path.replace(/^\/tools\//, "").replace(/\/$/, "");
    if (flatPathSlug && flatPathSlug !== entry.id && !flatPathSlug.includes("/")) {
      // unusual
    }
  }
}

// Flat inventory paths that don't exist as dedicated and aren't catch-all capable when used as-is
const flatPathIssues = [];
for (const entry of inventory) {
  const flat = entry.path; // e.g. /tools/audio-compressor/
  const slug = flat.replace(/^\/+tools\/+/, "").replace(/\/+$/, "");
  if (!slug || slug.includes("/")) continue;
  const en = canResolve(entry.id, slug, CATEGORY_TO_HUB[entry.primaryCategory]);
  // Flat URL /tools/slug/ always hits tools/[slug] if in static params
  if (!registry.has(entry.id) && !audioIds.has(entry.id) && !hasDedicatedPage(slug)) {
    flatPathIssues.push({
      id: entry.id,
      path: flat,
      problem: "Flat inventory path has no dedicated page and is not registry/audio — /tools/{slug}/ may 404",
    });
  }
}

// Check mega-menu / hardcoded hrefs in src for /tools/ that point to missing pages
const hardcoded = [];
const srcRoot = path.join(root, "src");
function scanFile(file) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/\/(?:en|he|ru)?\/?tools\/([a-z0-9-/]+)/g)) {
    const seg = m[1].replace(/\/$/, "");
    if (!seg || seg.includes("${") || seg.includes("[")) continue;
    hardcoded.push({ file: path.relative(root, file), path: `/tools/${seg}/` });
  }
}
function walkSrc(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSrc(full);
    else if (/\.(ts|tsx|js|jsx|json|mjs|cjs)$/.test(entry.name)) {
      try {
        scanFile(full);
      } catch {
        /* ignore */
      }
    }
  }
}
// Too heavy to scan all - sample key link builders only
for (const rel of [
  "src/lib/mega-menu.ts",
  "src/lib/footer-directory.ts",
  "src/data/tools-inventory.ts",
  "src/lib/home-hero-launch.ts",
  "src/lib/featured-tools.ts",
  "src/lib/pdf-tools-hub.ts",
]) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) scanFile(full);
}

const uniqueHard = new Map();
for (const h of hardcoded) {
  uniqueHard.set(h.path, h);
}

const hardcoded404 = [];
for (const [p, meta] of uniqueHard) {
  const parts = p.replace(/^\/tools\//, "").replace(/\/$/, "").split("/");
  if (parts.length === 1) {
    const slug = parts[0];
    if (hubPages.has(slug)) continue; // hub index ok
    if (hasDedicatedPage(slug)) continue;
    if (registry.has(slug) || audioIds.has(slug)) continue;
    hardcoded404.push({ ...meta, problem: "Flat tool path likely 404" });
  } else if (parts.length === 2) {
    const [hub, slug] = parts;
    if (!hubPages.has(hub) && !hasDedicatedPage(hub)) {
      hardcoded404.push({ ...meta, problem: `Unknown hub segment "${hub}"` });
      continue;
    }
    if (hasDedicatedPage(slug) || fs.existsSync(path.join(toolsApp, hub, slug, "page.tsx"))) continue;
    if (hasHubSlugCatchAll(hub) && (registry.has(slug) || audioIds.has(slug) || Object.values(ruMap).includes(slug) || ruMap[slug])) {
      continue;
    }
    // resolve RU reverse
    const canonical = Object.entries(ruMap).find(([, v]) => v === slug)?.[0] || slug;
    if (hasHubSlugCatchAll(hub) && (registry.has(canonical) || audioIds.has(canonical))) continue;
    if (!hasHubSlugCatchAll(hub) && !hasDedicatedPage(slug)) {
      hardcoded404.push({
        ...meta,
        problem: `Nested path has no page and no ${hub}/[slug] catch-all`,
      });
    }
  }
}

console.log("=== TOOL LINK 404 AUDIT ===\n");
console.log(`Inventory tools: ${inventory.length}`);
console.log(`Registry tools: ${registry.size}`);
console.log(`Audio tools: ${audioIds.size}`);
console.log(`RU mapped: ${Object.keys(ruMap).length}`);
console.log(`Hub folders: ${[...hubPages].sort().join(", ")}`);
console.log(`\n--- Resolve failures (EN/RU nested hrefs) : ${issues.length} ---`);
if (issues.length) {
  for (const i of issues) {
    console.log(
      `[${i.locale}] ${i.id}\n  href: ${i.href}\n  hub: ${i.hub || "(none)"}\n  reason: ${i.problem}\n`,
    );
  }
} else {
  console.log("(none)\n");
}

console.log(`--- Flat inventory paths at risk: ${flatPathIssues.length} ---`);
for (const i of flatPathIssues.slice(0, 80)) {
  console.log(`- ${i.id}: ${i.path}\n  ${i.problem}`);
}
if (flatPathIssues.length > 80) console.log(`... and ${flatPathIssues.length - 80} more`);

console.log(`\n--- Hardcoded link samples at risk: ${hardcoded404.length} ---`);
for (const i of hardcoded404.slice(0, 50)) {
  console.log(`- ${i.path} (${i.file})\n  ${i.problem}`);
}

// Summarize by category
const byCat = {};
for (const i of issues) {
  byCat[i.primaryCategory] = (byCat[i.primaryCategory] || 0) + 1;
}
console.log("\n--- Failures by primaryCategory ---");
console.log(byCat);

// Write JSON report
const report = { issues, flatPathIssues, hardcoded404, byCat, generatedAt: new Date().toISOString() };
fs.writeFileSync(path.join(root, "scripts/tool-404-audit-report.json"), JSON.stringify(report, null, 2));
console.log("\nWrote scripts/tool-404-audit-report.json");
