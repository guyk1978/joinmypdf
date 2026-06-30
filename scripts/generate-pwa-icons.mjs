import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const iconsDir = path.join(root, "assets", "icons");
const sourceSvg = path.join(iconsDir, "icon-source.svg");

const PNG_EXPORTS = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

const svgBuffer = await readFile(sourceSvg);
await mkdir(iconsDir, { recursive: true });

for (const { name, size } of PNG_EXPORTS) {
  const outPath = path.join(iconsDir, name);
  await sharp(svgBuffer, { density: Math.max(192, size * 2) })
    .resize(size, size, { fit: "contain", background: "#151a20" })
    .png()
    .toFile(outPath);
  console.log(`Generated ${path.relative(root, outPath)}`);
}

const favicon32 = await readFile(path.join(iconsDir, "favicon-32x32.png"));
await writeFile(path.join(iconsDir, "favicon.ico"), favicon32);
console.log("Generated assets/icons/favicon.ico");

await writeFile(path.join(iconsDir, "favicon.svg"), svgBuffer);
await writeFile(path.join(iconsDir, "icon-192.svg"), svgBuffer);
await writeFile(path.join(iconsDir, "icon-512.svg"), svgBuffer);
console.log("Synced SVG favicon variants from icon-source.svg");
