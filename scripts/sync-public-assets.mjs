import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const qpdfRunPkg = path.join(root, "node_modules", "qpdf-run");

async function syncQpdfVendor(destRoot) {
  const dest = path.join(destRoot, "vendor", "qpdf");
  const destRun = path.join(destRoot, "vendor", "qpdf-run");
  await mkdir(dest, { recursive: true });
  await mkdir(destRun, { recursive: true });

  await cp(path.join(qpdfRunPkg, "src", "worker.js"), path.join(dest, "worker.js"));
  await cp(path.join(qpdfRunPkg, "vendor", "qpdf", "lib", "qpdf.js"), path.join(dest, "qpdf.js"));
  await cp(path.join(qpdfRunPkg, "vendor", "qpdf", "lib", "qpdf.wasm"), path.join(dest, "qpdf.wasm"));

  for (const file of ["index.js", "browserRunner.js", "bytes.js"]) {
    await cp(path.join(qpdfRunPkg, "src", file), path.join(destRun, file));
  }
}

await mkdir(publicDir, { recursive: true });
await cp(path.join(root, "assets"), path.join(publicDir, "assets"), { recursive: true });
await cp(path.join(root, "manifest.webmanifest"), path.join(publicDir, "manifest.webmanifest"));
await syncQpdfVendor(root);
await syncQpdfVendor(publicDir);

console.log("Synced assets → public/ (+ QPDF vendor)");
