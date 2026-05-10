import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const toolsJsonPath = path.join(root, "assets", "data", "tools.json");
const blogJsonPath = path.join(root, "assets", "data", "blog.json");

const toolsRegistry = JSON.parse(await readFile(toolsJsonPath, "utf8"));
const blogRegistry = JSON.parse(await readFile(blogJsonPath, "utf8"));

const issues = [];
const blogs = blogRegistry.blog || [];
const tools = toolsRegistry.tools || [];

const toolSlugs = new Set(tools.map((tool) => tool.slug));
const blogSlugs = new Set(blogs.map((post) => post.slug));

if (blogSlugs.size !== blogs.length) {
  issues.push("Duplicate blog slugs detected.");
}

for (const post of blogs) {
  const outgoingTools = (post.relatedTools || []).filter((slug) => toolSlugs.has(slug));
  const outgoingBlogs = (post.relatedBlogs || []).filter((slug) => blogSlugs.has(slug) && slug !== post.slug);
  if (outgoingTools.length < 2) {
    issues.push("Blog " + post.slug + " has fewer than 2 tool links.");
  }
  if (outgoingBlogs.length < 2) {
    issues.push("Blog " + post.slug + " has fewer than 2 related blog links.");
  }
}

for (const tool of tools) {
  const incomingBlogs = blogs.filter((post) => (post.relatedTools || []).includes(tool.slug));
  if (incomingBlogs.length < 3) {
    issues.push("Tool " + tool.slug + " receives fewer than 3 blog backlinks.");
  }
}

for (const post of blogs) {
  const incoming = blogs.filter((entry) => (entry.relatedBlogs || []).includes(post.slug));
  if (incoming.length < 2) {
    issues.push("Potential orphan blog " + post.slug + " has fewer than 2 incoming blog links.");
  }
}

if (issues.length) {
  console.log("Index graph audit found issues:");
  issues.forEach((issue) => console.log("- " + issue));
  process.exit(1);
}

console.log("Index graph audit passed.");
