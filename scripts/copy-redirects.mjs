/**
 * After Cloudflare/Next build:
 * 1. Copy root `_redirects` into publish roots (next.config redirects are ignored with `output: "export"`).
 * 2. Ensure `_routes.json` excludes unlocalized `/tools` paths so the Pages Worker
 *    does not swallow those requests before `_redirects` can 301 to `/en/tools/...`.
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const redirectsSrc = path.join(root, "_redirects");

const TOOL_ROUTE_EXCLUDES = ["/tools", "/tools/", "/tools/*"];

const redirectTargets = [
  path.join(root, "public", "_redirects"),
  path.join(root, "out", "_redirects"),
  path.join(root, ".vercel", "output", "static", "_redirects"),
];

for (const dest of redirectTargets) {
  try {
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(redirectsSrc, dest);
    console.log(`copy-redirects: ${path.relative(root, dest)}`);
  } catch (error) {
    console.warn(
      `copy-redirects: skipped ${path.relative(root, dest)} (${error.code || error.message})`
    );
  }
}

async function ensureToolRouteExcludes(routesPath) {
  let routes = { version: 1, include: ["/*"], exclude: [] };

  try {
    const raw = await readFile(routesPath, "utf8");
    routes = JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(
        `copy-redirects: could not read ${path.relative(root, routesPath)} (${error.message})`
      );
      return;
    }
  }

  const exclude = Array.isArray(routes.exclude) ? [...routes.exclude] : [];
  let added = 0;
  for (const pattern of TOOL_ROUTE_EXCLUDES) {
    if (!exclude.includes(pattern)) {
      exclude.push(pattern);
      added += 1;
    }
  }

  routes.version = routes.version ?? 1;
  routes.exclude = exclude;
  if (!Array.isArray(routes.include) || routes.include.length === 0) {
    routes.include = ["/*"];
  }

  await mkdir(path.dirname(routesPath), { recursive: true });
  await writeFile(routesPath, `${JSON.stringify(routes, null, 2)}\n`, "utf8");
  console.log(
    `copy-redirects: patched ${path.relative(root, routesPath)} (+${added} tool excludes)`
  );
}

const routesTargets = [
  path.join(root, ".vercel", "output", "static", "_routes.json"),
  path.join(root, "out", "_routes.json"),
];

for (const routesPath of routesTargets) {
  try {
    await ensureToolRouteExcludes(routesPath);
  } catch (error) {
    console.warn(
      `copy-redirects: skipped routes patch ${path.relative(root, routesPath)} (${error.message})`
    );
  }
}
