/**
 * Lightweight status probe (follow redirects, no huge HTML parse).
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const PORT = Number(process.env.PORT || 3000);
const root = path.join(__dirname, "..");

function loadInventory() {
  const src = fs.readFileSync(path.join(root, "src/data/tools-inventory.ts"), "utf8");
  const entries = [];
  const re = /id:\s*"([^"]+)"[\s\S]*?primaryCategory:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) entries.push({ id: m[1], primaryCategory: m[2] });
  return entries;
}
function loadRuMap() {
  const src = fs.readFileSync(path.join(root, "src/lib/locale-tool-slugs.ts"), "utf8");
  const map = {};
  for (const m of src.matchAll(/^\s*"([a-z0-9-]+)":\s*"([a-z0-9-]+)"/gm)) map[m[1]] = m[2];
  return map;
}
const HUB = {
  pdf: "pdf-tools", video: "video-tools", mp4: "mp4-tools", convert: "convert-tools",
  compress: "compress-tools", extract: "extract-tools", image: "image-tools", jpg: "jpg-tools",
  png: "png-tools", mp3: "mp3-tools", audio: "mp3-tools", favicon: "favicon-tools",
  text: "text-tools", json: "json-tools", yaml: "yaml-tools", xml: "xml-tools",
  developer: "developer-tools", word: "word-tools", excel: "excel-tools", crop: "crop-tools",
  rotate: "rotate-tools", security: "security-tools", design: "image-tools",
  data: "data-conversion-tools", productivity: "productivity-tools",
  "unit-math": "unit-converters", network: "network-tools",
};

function once(urlPath) {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: "127.0.0.1", port: PORT, path: urlPath, method: "GET", timeout: 120000 },
      (res) => {
        res.resume();
        resolve({ status: res.statusCode || 0, location: res.headers.location || null });
      },
    );
    req.on("error", (e) => resolve({ status: 0, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, error: "timeout" }); });
    req.end();
  });
}

async function follow(start) {
  let cur = start;
  for (let i = 0; i < 6; i++) {
    const r = await once(cur);
    if ([301,302,307,308].includes(r.status) && r.location) {
      let next = r.location;
      if (next.startsWith("http")) next = new URL(next).pathname;
      cur = next.startsWith("/") ? next : `/${next}`;
      continue;
    }
    return { start, final: cur, status: r.status, error: r.error };
  }
  return { start, final: cur, status: 0, error: "redirect-loop" };
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }));
  return out;
}

(async () => {
  // warm a couple
  console.log("warm", await follow("/en/tools/"));
  const inv = loadInventory();
  const ru = loadRuMap();
  const urls = [];

  // All RU nested (highest risk historically)
  for (const e of inv) {
    const hub = HUB[e.primaryCategory];
    if (!hub) continue;
    urls.push({ id: e.id, locale: "ru", path: `/ru/tools/${hub}/${ru[e.id] || e.id}/` });
  }
  // All EN nested
  for (const e of inv) {
    const hub = HUB[e.primaryCategory];
    if (!hub) continue;
    urls.push({ id: e.id, locale: "en", path: `/en/tools/${hub}/${e.id}/` });
  }
  // HE sample of audio + a few
  for (const e of inv.filter((x) => ["mp3","audio","video"].includes(x.primaryCategory))) {
    urls.push({ id: e.id, locale: "he", path: `/he/tools/${HUB[e.primaryCategory]}/${e.id}/` });
  }
  // Hubs
  for (const locale of ["en","he","ru"]) {
    for (const hub of ["xml-tools","yaml-tools","mp3-tools","pdf-tools","all-tools"]) {
      const p = hub === "all-tools" ? `/${locale}/all-tools/` : `/${locale}/tools/${hub}/`;
      urls.push({ id: hub, locale, path: p, kind: "hub" });
    }
  }
  // Known fake
  urls.push({ id: "FAKE", locale: "en", path: "/en/tools/pdf-tools/not-a-real-tool-zzz/" });

  console.log(`Probing ${urls.length}...`);
  const results = await pool(urls, 4, async (u) => {
    const r = await follow(u.path);
    return { ...u, ...r };
  });

  const broken = results.filter((r) => r.status === 404 || r.status === 0 || r.status >= 500);
  const only404 = results.filter((r) => r.status === 404);
  const err500 = results.filter((r) => r.status >= 500);
  const timeouts = results.filter((r) => r.status === 0);

  console.log(`404: ${only404.length}`);
  console.log(`500+: ${err500.length}`);
  console.log(`timeout/error: ${timeouts.length}`);

  console.log("\n=== DETAILED 404 LIST ===");
  if (!only404.length) console.log("(none)");
  for (const r of only404) {
    console.log(`[${r.locale}] ${r.path}  (id=${r.id}) final=${r.final} status=${r.status}`);
  }

  console.log("\n=== 500 LIST ===");
  for (const r of err500) {
    console.log(`[${r.locale}] ${r.status} ${r.path} (id=${r.id})`);
  }

  console.log("\n=== TIMEOUT/ERROR (first 30) ===");
  for (const r of timeouts.slice(0, 30)) {
    console.log(`[${r.locale}] ${r.path} ${r.error || ""}`);
  }

  fs.writeFileSync(
    path.join(root, "scripts/tool-404-status-report.json"),
    JSON.stringify({ only404, err500, timeouts, total: results.length, at: new Date().toISOString() }, null, 2),
  );
  console.log("\nWrote scripts/tool-404-status-report.json");
})();
