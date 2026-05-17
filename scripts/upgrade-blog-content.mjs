import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { upgradeRegistry } from "./lib/blog-content-engine.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const blogPath = path.join(root, "assets", "data", "blog.json");

const registry = JSON.parse(await readFile(blogPath, "utf8"));
const upgraded = upgradeRegistry(registry);

const thin = upgraded.blog.filter((p) => (p.contentBlocks?.wordCount || 0) < 400);
if (thin.length) {
  console.warn("Warning:", thin.length, "posts still under 400 words — review manually.");
}

await writeFile(blogPath, JSON.stringify(upgraded, null, 2), "utf8");
console.log("Upgraded", upgraded.blog.length, "blog posts in", blogPath);
