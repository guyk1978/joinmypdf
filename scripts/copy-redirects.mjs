/**
 * Copy root `_redirects` into Next/Cloudflare publish roots so Pages can apply 301s.
 * `next.config` redirects are ignored when `output: "export"`.
 */
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "_redirects");

const targets = [
  path.join(root, "public", "_redirects"),
  path.join(root, "out", "_redirects"),
  path.join(root, ".vercel", "output", "static", "_redirects"),
];

for (const dest of targets) {
  try {
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(src, dest);
    console.log(`copy-redirects: ${path.relative(root, dest)}`);
  } catch (error) {
    console.warn(`copy-redirects: skipped ${path.relative(root, dest)} (${error.code || error.message})`);
  }
}
