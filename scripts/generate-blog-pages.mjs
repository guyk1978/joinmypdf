import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const blogJsonPath = path.join(root, "assets", "data", "blog.json");
const blogTemplatePath = path.join(root, "blog", "template", "index.html");
const blogRoot = path.join(root, "blog");

const blogRegistry = JSON.parse(await readFile(blogJsonPath, "utf8"));
const template = await readFile(blogTemplatePath, "utf8");

for (const post of blogRegistry.blog || []) {
  const targetDir = path.join(blogRoot, post.slug);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, "index.html"), template, "utf8");
}

console.log("Blog pages generated from blog.json");
