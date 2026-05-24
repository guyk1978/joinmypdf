import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");

await mkdir(publicDir, { recursive: true });
await cp(path.join(root, "assets"), path.join(publicDir, "assets"), { recursive: true });
await cp(path.join(root, "manifest.webmanifest"), path.join(publicDir, "manifest.webmanifest"));

console.log("Synced assets → public/");
