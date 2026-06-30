import { cp, copyFile, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const toolsHubSrc = path.join(root, "tools", "index.html");
const toolsHubPublic = path.join(publicDir, "tools", "index.html");
const outDir = path.join(root, "out");

const GENERATED_PUBLIC_PATHS = [
  path.join(publicDir, "tools"),
  path.join(publicDir, "blog"),
];

const OUT_GENERATED_PATHS = [
  path.join(outDir, "tools"),
  path.join(outDir, "blog"),
];

async function purgeGeneratedTargets() {
  for (const target of [...GENERATED_PUBLIC_PATHS, ...OUT_GENERATED_PATHS]) {
    await rm(target, { recursive: true, force: true });
  }
  await removeTxtArtifacts(publicDir);
  await removeTxtArtifacts(outDir);
}

async function removeTxtArtifacts(baseDir) {
  let entries = [];
  try {
    entries = await readdir(baseDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      await removeTxtArtifacts(fullPath);
      continue;
    }
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".txt" && entry.name !== "ads.txt") {
      await rm(fullPath, { force: true });
    }
  }
}

function shouldCopyAsset(src) {
  const ext = path.extname(src).toLowerCase();
  if (ext === ".txt") return false;
  return true;
}

await purgeGeneratedTargets();
await mkdir(publicDir, { recursive: true });

const { execSync } = await import("node:child_process");
execSync("node scripts/generate-pwa-icons.mjs", { cwd: root, stdio: "inherit" });

await cp(path.join(root, "assets"), path.join(publicDir, "assets"), {
  recursive: true,
  force: true,
  filter: shouldCopyAsset,
});
await cp(path.join(root, "manifest.webmanifest"), path.join(publicDir, "manifest.webmanifest"));
await copyFile(path.join(root, "ads.txt"), path.join(publicDir, "ads.txt"));

const publicRootAssets = [
  "heder-dark-EN-2.png",
  "heder-dark-HE-2.png",
  "heder-light-EN-2.png",
  "heder-light-HE-2.png",
  "heder-privacy-first-EN.png",
  "heder-privacy-first-HE.png",
];
for (const filename of publicRootAssets) {
  await copyFile(
    path.join(root, "assets", "brand", filename),
    path.join(publicDir, filename),
  );
}

const homepageMarketingImages = ["home-photo-en.png", "home-photo-he.png"];
await mkdir(path.join(publicDir, "img"), { recursive: true });
for (const filename of homepageMarketingImages) {
  await copyFile(
    path.join(root, "assets", "img", filename),
    path.join(publicDir, "img", filename),
  );
}

const pwaIconFiles = [
  "favicon-16x16.png",
  "favicon-32x32.png",
  "favicon.ico",
  "favicon.svg",
  "apple-touch-icon.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
  "icon-192.svg",
  "icon-512.svg",
];
await mkdir(path.join(publicDir, "icons"), { recursive: true });
for (const filename of pwaIconFiles) {
  await copyFile(
    path.join(root, "assets", "icons", filename),
    path.join(publicDir, "icons", filename),
  );
}

await copyFile(path.join(root, "sw.js"), path.join(publicDir, "sw.js"));

await mkdir(path.join(publicDir, "tools"), { recursive: true });
await copyFile(toolsHubSrc, toolsHubPublic);

console.log("Synced assets → public/ after purging generated route artifacts.");
