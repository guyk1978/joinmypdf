/**
 * Generates thin nested tool route files under each category hub:
 * src/app/[locale]/tools/{hub}/[slug]/page.tsx
 *
 * Skips hubs with zero inventory tools (required for Next.js output: export).
 * Run: node scripts/generate-hub-nested-tool-pages.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const toolsRoot = path.join(root, "src", "app", "[locale]", "tools");
const inventoryPath = path.join(root, "src", "data", "tools-inventory.ts");
const inventorySrc = fs.readFileSync(inventoryPath, "utf8");

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

function categoryHasTools(categoryId) {
  const re = new RegExp(`"${categoryId}"`, "g");
  return (inventorySrc.match(re) || []).length > 0;
}

const pageTemplate = (categoryId) => `import { listHubToolStaticParams } from "@/lib/create-hub-tool-page";

export { default, generateMetadata } from "../../[slug]/page";

export function generateStaticParams() {
  return listHubToolStaticParams("${categoryId}");
}
`;

for (const [hub, categoryId] of Object.entries(HUBS)) {
  const slugDir = path.join(toolsRoot, hub, "[slug]");
  const pagePath = path.join(slugDir, "page.tsx");

  if (!categoryHasTools(categoryId)) {
    if (fs.existsSync(pagePath)) {
      fs.rmSync(slugDir, { recursive: true, force: true });
      console.log("removed empty hub slug route", hub);
    } else {
      console.log("skip empty hub", hub);
    }
    continue;
  }

  const hubDir = path.join(toolsRoot, hub);
  if (!fs.existsSync(hubDir)) {
    fs.mkdirSync(hubDir, { recursive: true });
    console.log("created hub dir", hub);
  }
  fs.mkdirSync(slugDir, { recursive: true });
  fs.writeFileSync(pagePath, pageTemplate(categoryId));
  console.log("wrote", path.relative(root, pagePath));
}

console.log("done");
