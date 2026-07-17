/**
 * Generates thin nested tool route files under each category hub:
 * src/app/[locale]/tools/{hub}/[slug]/page.tsx
 *
 * Run: node scripts/generate-hub-nested-tool-pages.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const toolsRoot = path.join(root, "src", "app", "[locale]", "tools");

/** hub folder name → inventory category id */
const HUBS = {
  "pdf-tools": "pdf",
  "video-tools": "video",
  "mp4-tools": "mp4",
  "convert-tools": "convert",
  "compress-tools": "compress",
  "extract-tools": "extract",
  "image-tools": "image",
  "jpg-tools": "jpg",
  "png-tools": "png",
  "mp3-tools": "mp3",
  "favicon-tools": "favicon",
  "text-tools": "text",
  "json-tools": "json",
  "yaml-tools": "yaml",
  "xml-tools": "xml",
  "developer-tools": "developer",
  "word-tools": "word",
  "excel-tools": "excel",
  "crop-tools": "crop",
  "rotate-tools": "rotate",
  "security-tools": "security",
  "data-conversion-tools": "data",
  "productivity-tools": "productivity",
  "unit-converters": "unit-math",
  "network-tools": "network",
};

const pageTemplate = (categoryId) => `import { createHubToolStaticParams } from "@/lib/create-hub-tool-page";

export { default, generateMetadata } from "../../[slug]/page";
export const generateStaticParams = createHubToolStaticParams("${categoryId}");
`;

for (const [hub, categoryId] of Object.entries(HUBS)) {
  const hubDir = path.join(toolsRoot, hub);
  if (!fs.existsSync(hubDir)) {
    fs.mkdirSync(hubDir, { recursive: true });
    console.log("created hub dir", hub);
  }
  const slugDir = path.join(hubDir, "[slug]");
  fs.mkdirSync(slugDir, { recursive: true });
  const pagePath = path.join(slugDir, "page.tsx");
  // Keep existing dedicated nested tools (e.g. network-tools/my-ip) — only write [slug] route.
  fs.writeFileSync(pagePath, pageTemplate(categoryId));
  console.log("wrote", path.relative(root, pagePath));
}

console.log("done", Object.keys(HUBS).length, "hubs");
