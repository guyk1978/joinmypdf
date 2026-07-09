import fs from "node:fs";

const reg = fs.readFileSync("src/lib/tool-seo-overrides.ts", "utf8");
const m = reg.match(/SEO_TOOL_SLUGS = \[([^\]]+)\]/);
const slugs = new Set(
  m[1].split(",").map((s) => s.trim().replace(/["']/g, "")),
);
const tools = JSON.parse(fs.readFileSync("assets/data/tools.json", "utf8")).tools;
const missing = tools.map((t) => t.slug).filter((s) => !slugs.has(s));
console.log("missing count", missing.length);
console.log(missing.join("\n"));
