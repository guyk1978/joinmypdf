/**
 * Probe live HTTP status for generated tool hrefs (en/he/ru).
 * Requires next dev on PORT (default 3000).
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const root = path.join(__dirname, "..");

function loadInventory() {
  const src = fs.readFileSync(path.join(root, "src/data/tools-inventory.ts"), "utf8");
  const entries = [];
  const re =
    /id:\s*"([^"]+)"[\s\S]*?primaryCategory:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) {
    entries.push({ id: m[1], primaryCategory: m[2] });
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

function href(locale, hub, slug) {
  return `/${locale}/tools/${hub}/${slug}/`;
}

function get(urlPath) {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: "127.0.0.1", port: PORT, path: urlPath, method: "GET", timeout: 15000 },
      (res) => {
        res.resume();
        resolve({ path: urlPath, status: res.statusCode });
      },
    );
    req.on("error", (err) => resolve({ path: urlPath, status: 0, error: err.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ path: urlPath, status: 0, error: "timeout" });
    });
    req.end();
  });
}

async function mapPool(items, concurrency, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

(async () => {
  const inv = loadInventory();
  const ru = loadRuMap();
  const urls = [];

  for (const e of inv) {
    const hub = CATEGORY_TO_HUB[e.primaryCategory];
    if (!hub) {
      urls.push({ kind: "missing-hub", path: `NO_HUB:${e.id}:${e.primaryCategory}` });
      continue;
    }
    urls.push({ kind: "en", path: href("en", hub, e.id), id: e.id });
    urls.push({ kind: "he", path: href("he", hub, e.id), id: e.id });
    urls.push({ kind: "ru", path: href("ru", hub, ru[e.id] || e.id), id: e.id });
  }

  // Also probe a few hub indexes and all-tools
  for (const locale of ["en", "he", "ru"]) {
    urls.push({ kind: "hub", path: `/${locale}/tools/` });
    urls.push({ kind: "all", path: `/${locale}/all-tools/` });
    urls.push({ kind: "hub", path: `/${locale}/tools/pdf-tools/` });
    urls.push({ kind: "hub", path: `/${locale}/tools/mp3-tools/` });
    urls.push({ kind: "hub", path: `/${locale}/tools/yaml-tools/` });
    urls.push({ kind: "hub", path: `/${locale}/tools/xml-tools/` });
  }

  console.log(`Probing ${urls.length} URLs on :${PORT} ...`);
  const results = await mapPool(urls, 8, (u) => get(u.path).then((r) => ({ ...u, ...r })));

  const bad = results.filter((r) => r.status !== 200 && r.status !== 308 && r.status !== 307 && r.status !== 301);
  // Next may return 200 for soft notFound? Usually 404.
  const notFound = results.filter((r) => r.status === 404);
  const errors = results.filter((r) => r.status === 0);

  console.log(`OK-ish (200/3xx): ${results.length - bad.length}`);
  console.log(`404: ${notFound.length}`);
  console.log(`network errors: ${errors.length}`);

  console.log("\n=== 404 LIST ===");
  for (const r of notFound) {
    console.log(`[${r.kind}] ${r.status} ${r.path}${r.id ? ` (${r.id})` : ""}`);
  }
  if (errors.length) {
    console.log("\n=== ERRORS ===");
    for (const r of errors.slice(0, 20)) {
      console.log(`${r.path} ${r.error}`);
    }
  }

  fs.writeFileSync(
    path.join(root, "scripts/tool-404-live-report.json"),
    JSON.stringify({ notFound, errors, total: results.length, generatedAt: new Date().toISOString() }, null, 2),
  );
  console.log("\nWrote scripts/tool-404-live-report.json");
})();
