import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildTier1Post } from "./lib/blog-tier1-engine.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const blogPath = path.join(root, "assets", "data", "blog.json");
const priorityPath = path.join(root, "assets", "data", "blog-tier1-priority.json");

const registry = JSON.parse(await readFile(blogPath, "utf8"));
const { tier1Slugs } = JSON.parse(await readFile(priorityPath, "utf8"));
const set = new Set(tier1Slugs);

let applied = 0;
registry.blog = registry.blog.map((post) => {
  if (!set.has(post.slug)) return post;
  applied += 1;
  return buildTier1Post(post);
});

await writeFile(blogPath, JSON.stringify(registry, null, 2), "utf8");
console.log("Tier-1 applied to", applied, "posts");

const tier1Posts = registry.blog.filter((p) => p.tier1);
const counts = tier1Posts.map((p) => p.contentBlocks?.wordCount || 0);
console.log(
  "Word counts — min:",
  Math.min(...counts),
  "max:",
  Math.max(...counts),
  "avg:",
  Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)
);
