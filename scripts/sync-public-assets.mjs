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
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".txt") {
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
await cp(path.join(root, "assets"), path.join(publicDir, "assets"), {
  recursive: true,
  force: true,
  filter: shouldCopyAsset,
});
await cp(path.join(root, "manifest.webmanifest"), path.join(publicDir, "manifest.webmanifest"));

const publicRootAssets = [
  "heder-dark-EN-1.png",
  "heder-dark-HE-1.png",
  "heder-light-EN-1.png",
  "heder-light-HE-1.png",
];
for (const filename of publicRootAssets) {
  await copyFile(
    path.join(root, "assets", "brand", filename),
    path.join(publicDir, filename),
  );
}

await mkdir(path.join(publicDir, "tools"), { recursive: true });
await copyFile(toolsHubSrc, toolsHubPublic);

console.log("Synced assets → public/ after purging generated route artifacts.");
