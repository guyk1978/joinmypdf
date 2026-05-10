import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir, stat } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const TARGET_TAG = '<script src="/assets/js/email-popup.js" defer></script>';
const ANCHOR_RE = /([ \t]*)<script src="\/assets\/js\/pwa-install\.js" defer><\/script>/;
const SENTINEL = "/assets/js/email-popup.js";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));
const isApply = flags.has("--apply");
const onlyArg = positional[0];

const SKIP_DIRS = new Set([".git", "node_modules", "logs", "drafts", "scripts"]);

async function walk(dir, out) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(full, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      out.push(full);
    }
  }
}

function buildNewContent(content) {
  const match = content.match(ANCHOR_RE);
  if (!match) return { changed: false, content, reason: "no anchor" };
  if (content.includes(SENTINEL)) return { changed: false, content, reason: "already injected" };
  const indent = match[1] || "    ";
  const insertion = match[0] + "\n" + indent + TARGET_TAG;
  const next = content.replace(ANCHOR_RE, insertion);
  if (next === content) return { changed: false, content, reason: "replace produced no change" };
  return { changed: true, content: next, reason: "ok" };
}

function unifiedDiff(filePath, before, after) {
  const beforeLines = before.split(/\r?\n/);
  const afterLines = after.split(/\r?\n/);
  let firstDiff = -1;
  for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i += 1) {
    if (beforeLines[i] !== afterLines[i]) { firstDiff = i; break; }
  }
  if (firstDiff < 0) return "(no textual diff)";
  const start = Math.max(0, firstDiff - 3);
  const beforeEnd = Math.min(beforeLines.length, firstDiff + 5);
  const afterEnd = Math.min(afterLines.length, firstDiff + 6);
  const out = [
    "--- " + filePath + "  (before)",
    "+++ " + filePath + "  (after)",
    "@@ around line " + (firstDiff + 1) + " @@",
  ];
  for (let i = start; i < firstDiff; i += 1) out.push("  " + beforeLines[i]);
  for (let i = firstDiff; i < beforeEnd; i += 1) out.push("- " + beforeLines[i]);
  for (let i = firstDiff; i < afterEnd; i += 1) out.push("+ " + afterLines[i]);
  return out.join("\n");
}

async function atomicWrite(filePath, content) {
  const tmp = filePath + ".tmp-" + process.pid + "-" + Date.now();
  await writeFile(tmp, content, "utf8");
  await rename(tmp, filePath);
}

async function processFile(filePath, opts) {
  const before = await readFile(filePath, "utf8");
  const result = buildNewContent(before);
  if (!result.changed) {
    return { filePath, changed: false, reason: result.reason };
  }
  if (opts.apply) {
    await atomicWrite(filePath, result.content);
  }
  return {
    filePath,
    changed: true,
    reason: result.reason,
    diff: opts.diff ? unifiedDiff(filePath, before, result.content) : null,
  };
}

async function main() {
  if (onlyArg) {
    const target = path.resolve(root, onlyArg);
    const s = await stat(target).catch(() => null);
    if (!s || !s.isFile()) {
      console.error("Target not found or not a file: " + target);
      process.exit(2);
    }
    const result = await processFile(target, { apply: isApply, diff: true });
    if (result.changed) {
      console.log("[" + (isApply ? "APPLIED" : "DRY-RUN") + "] " + path.relative(root, result.filePath));
      if (result.diff) console.log(result.diff);
    } else {
      console.log("[SKIP] " + path.relative(root, result.filePath) + " (" + result.reason + ")");
    }
    return;
  }

  const all = [];
  await walk(root, all);
  let changed = 0;
  let skipped = 0;
  let already = 0;
  let noAnchor = 0;
  for (const f of all) {
    const result = await processFile(f, { apply: isApply, diff: false });
    if (result.changed) {
      changed += 1;
      console.log("[" + (isApply ? "APPLIED" : "WOULD-APPLY") + "] " + path.relative(root, result.filePath));
    } else {
      skipped += 1;
      if (result.reason === "already injected") already += 1;
      if (result.reason === "no anchor") noAnchor += 1;
    }
  }
  console.log("");
  console.log("Summary:");
  console.log("  scanned: " + all.length);
  console.log("  " + (isApply ? "applied" : "would-apply") + ": " + changed);
  console.log("  skipped: " + skipped + " (already-injected: " + already + ", no-anchor: " + noAnchor + ")");
  if (!isApply) console.log("\nRe-run with --apply to write changes.");
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
