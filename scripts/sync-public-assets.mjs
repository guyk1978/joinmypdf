import { cp, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const toolsHubSrc = path.join(root, "tools", "index.html");
const toolsHubPublic = path.join(publicDir, "tools", "index.html");

await mkdir(publicDir, { recursive: true });
await cp(path.join(root, "assets"), path.join(publicDir, "assets"), { recursive: true });
await cp(path.join(root, "manifest.webmanifest"), path.join(publicDir, "manifest.webmanifest"));

await mkdir(path.join(publicDir, "tools"), { recursive: true });
await copyFile(toolsHubSrc, toolsHubPublic);

console.log("Synced assets → public/ (including tools hub for /tools/ in dev & export)");
