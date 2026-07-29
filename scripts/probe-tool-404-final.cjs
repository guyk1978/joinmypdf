/**
 * Follow redirects and report real 404 / soft-404 tool links.
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

function requestOnce(urlPath) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: PORT,
        path: urlPath,
        method: "GET",
        timeout: 20000,
        headers: { Accept: "text/html" },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            location: res.headers.location || null,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", (err) => resolve({ status: 0, location: null, body: "", error: err.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 0, location: null, body: "", error: "timeout" });
    });
    req.end();
  });
}

async function fetchFollow(startPath, maxHops = 6) {
  let current = startPath;
  const chain = [current];
  for (let i = 0; i < maxHops; i++) {
    const res = await requestOnce(current);
    if ([301, 302, 307, 308].includes(res.status) && res.location) {
      let next = res.location;
      if (next.startsWith("http://") || next.startsWith("https://")) {
        try {
          next = new URL(next).pathname + (new URL(next).search || "");
        } catch {
          /* keep */
        }
      }
      if (!next.startsWith("/")) next = path.posix.normalize(`${path.posix.dirname(current)}/${next}`);
      current = next;
      chain.push(current);
      continue;
    }
    return { startPath, finalPath: current, chain, ...res };
  }
  return { startPath, finalPath: current, chain, status: 0, body: "", error: "too many redirects" };
}

function looksLikeNotFound(body, status) {
  if (status === 404) return true;
  if (!body) return false;
  const b = body.toLowerCase();
  if (b.includes("this page could not be found")) return true;
  if (b.includes("page not found")) return true;
  if (b.includes("הדף לא נמצא")) return true;
  if (b.includes("страница не найдена")) return true;
  // Next not-found often includes these markers
  if (/\b404\b/.test(b) && b.includes("not found")) return true;
  return false;
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
  const controlFake = await fetchFollow("/en/tools/pdf-tools/this-tool-does-not-exist-xyz/");
  const controlOk = await fetchFollow("/en/tools/pdf-tools/pdf-merge/");
  console.log(
    "CONTROL fake:",
    controlFake.status,
    "nf=",
    looksLikeNotFound(controlFake.body, controlFake.status),
    "final=",
    controlFake.finalPath,
  );
  console.log(
    "CONTROL ok pdf-merge:",
    controlOk.status,
    "nf=",
    looksLikeNotFound(controlOk.body, controlOk.status),
    "len=",
    controlOk.body.length,
  );

  const inv = loadInventory();
  const ru = loadRuMap();
  const urls = [];

  for (const locale of ["en", "he", "ru"]) {
    for (const e of inv) {
      const hub = CATEGORY_TO_HUB[e.primaryCategory];
      if (!hub) {
        urls.push({ id: e.id, locale, path: null, note: `no hub for ${e.primaryCategory}` });
        continue;
      }
      const slug = locale === "ru" ? ru[e.id] || e.id : e.id;
      urls.push({
        id: e.id,
        locale,
        category: e.primaryCategory,
        path: `/${locale}/tools/${hub}/${slug}/`,
      });
    }
  }

  // Extra: flat inventory-style paths (legacy)
  for (const e of inv) {
    urls.push({ id: e.id, locale: "en", category: e.primaryCategory, path: `/en/tools/${e.id}/`, kind: "flat" });
  }

  const valid = urls.filter((u) => u.path);
  console.log(`\nProbing ${valid.length} URLs with redirect follow...`);

  const results = await mapPool(valid, 8, async (u) => {
    const r = await fetchFollow(u.path);
    const nf = looksLikeNotFound(r.body, r.status);
    return {
      id: u.id,
      locale: u.locale,
      category: u.category,
      kind: u.kind || "nested",
      path: u.path,
      finalPath: r.finalPath,
      status: r.status,
      notFound: nf,
      error: r.error,
      len: r.body.length,
    };
  });

  const broken = results.filter((r) => r.notFound || r.status === 0 || (r.status >= 400 && r.status !== 404));
  // status 404 already in notFound; also catch 500s
  const hard404 = results.filter((r) => r.status === 404 || r.notFound);
  const serverErr = results.filter((r) => r.status >= 500 || r.status === 0);

  console.log(`\nBroken (404/soft-404): ${hard404.length}`);
  console.log(`Server/network errors: ${serverErr.length}`);

  // Group detailed list
  const byLocale = { en: [], he: [], ru: [] };
  for (const r of hard404) {
    (byLocale[r.locale] || (byLocale[r.locale] = [])).push(r);
  }

  for (const locale of Object.keys(byLocale)) {
    const list = byLocale[locale];
    console.log(`\n=== ${locale.toUpperCase()} broken (${list.length}) ===`);
    for (const r of list.sort((a, b) => a.path.localeCompare(b.path))) {
      console.log(`- ${r.path}`);
      console.log(`  id=${r.id} kind=${r.kind} status=${r.status} final=${r.finalPath}`);
    }
  }

  if (serverErr.length) {
    console.log(`\n=== SERVER/NETWORK ERRORS (${serverErr.length}) ===`);
    for (const r of serverErr.slice(0, 40)) {
      console.log(`- [${r.status}] ${r.path} ${r.error || ""}`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    controlFake: { status: controlFake.status, notFound: looksLikeNotFound(controlFake.body, controlFake.status) },
    controlOk: { status: controlOk.status, notFound: looksLikeNotFound(controlOk.body, controlOk.status) },
    totals: {
      probed: results.length,
      broken: hard404.length,
      serverErr: serverErr.length,
    },
    broken: hard404,
    serverErr,
  };
  fs.writeFileSync(path.join(root, "scripts/tool-404-final-report.json"), JSON.stringify(report, null, 2));
  console.log("\nWrote scripts/tool-404-final-report.json");
})();
