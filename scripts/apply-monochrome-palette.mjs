/**
 * One-shot palette normalizer: maps accent Tailwind families + common hex/rgba to neutral grayscale.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET_DIRS = [path.join(ROOT, "src"), path.join(ROOT, "public", "assets", "css")];

const TAILWIND_FAMILIES =
  "emerald|green|teal|cyan|blue|sky|indigo|violet|purple|red|rose|orange|amber|yellow|pink|fuchsia|lime";

const tailwindFamilyRe = new RegExp(`\\b(${TAILWIND_FAMILIES})-(\\d{2,3})\\b`, "g");

const HEX_REPLACEMENTS = [
  [/#0f172a\b/gi, "#000000"],
  [/#0c0e12\b/gi, "#000000"],
  [/#0a0c10\b/gi, "#000000"],
  [/#10141a\b/gi, "#0a0a0a"],
  [/#047857\b/gi, "#404040"],
  [/#065f46\b/gi, "#262626"],
  [/#059669\b/gi, "#525252"],
  [/#6ee7b7\b/gi, "#d4d4d4"],
  [/#a7f3d0\b/gi, "#e5e5e5"],
  [/#ecfdf5\b/gi, "#f5f5f5"],
  [/#d1fae5\b/gi, "#e5e5e5"],
  [/#f8fafc\b/gi, "#ffffff"],
  [/#eef1f5\b/gi, "#f5f5f5"],
  [/#e8ebf0\b/gi, "#e5e5e5"],
  [/#f4f5f7\b/gi, "#f5f5f5"],
  [/#334155\b/gi, "#404040"],
  [/#475569\b/gi, "#525252"],
  [/#64748b\b/gi, "#737373"],
  [/#94a3b8\b/gi, "#a3a3a3"],
  [/#cbd5e1\b/gi, "#d4d4d4"],
];

const RGBA_REPLACEMENTS = [
  [/rgba\(\s*16\s*,\s*185\s*,\s*129\s*,/gi, "rgba(115, 115, 115,"],
  [/rgba\(\s*52\s*,\s*211\s*,\s*153\s*,/gi, "rgba(163, 163, 163,"],
  [/rgba\(\s*59\s*,\s*130\s*,\s*246\s*,/gi, "rgba(115, 115, 115,"],
  [/rgba\(\s*37\s*,\s*99\s*,\s*235\s*,/gi, "rgba(115, 115, 115,"],
  [/rgba\(\s*139\s*,\s*92\s*,\s*246\s*,/gi, "rgba(115, 115, 115,"],
  [/rgba\(\s*249\s*,\s*115\s*,\s*22\s*,/gi, "rgba(115, 115, 115,"],
  [/rgba\(\s*239\s*,\s*68\s*,\s*68\s*,/gi, "rgba(115, 115, 115,"],
  [/rgba\(\s*15\s*,\s*23\s*,\s*42\s*,/gi, "rgba(0, 0, 0,"],
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walk(full, files);
    } else if (/\.(tsx?|css|jsx|mjs)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function toGrayHex(hex) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.length === 6
        ? h
        : null;
  if (!full) return hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const clamped = Math.max(0, Math.min(255, lum));
  const out = clamped.toString(16).padStart(2, "0");
  return `#${out}${out}${out}`;
}

function grayscaleSvgColors(text) {
  return text.replace(/(fill|stroke)=["'](#[0-9a-fA-F]{3,8})["']/g, (match, attr, color) => {
    if (/^#(?:fff|ffffff)$/i.test(color)) return `${attr}="${color}"`;
    if (/^#(?:000|000000)$/i.test(color)) return `${attr}="${color}"`;
    return `${attr}="${toGrayHex(color)}"`;
  });
}

function transform(content, filePath) {
  if (
    filePath.endsWith("tool-icons.tsx") ||
    filePath.endsWith("tool-glass-theme.ts") ||
    filePath.endsWith("blog-categories.ts")
  ) {
    return content;
  }

  let out = content;
  out = out.replace(tailwindFamilyRe, "neutral-$2");
  out = out.replace(/\bslate-(\d{2,3})\b/g, "neutral-$1");
  for (const [re, rep] of HEX_REPLACEMENTS) out = out.replace(re, rep);
  for (const [re, rep] of RGBA_REPLACEMENTS) out = out.replace(re, rep);
  return out;
}

let changed = 0;
for (const dir of TARGET_DIRS) {
  try {
    for (const file of walk(dir)) {
      const before = readFileSync(file, "utf8");
      const after = transform(before, file);
      if (after !== before) {
        writeFileSync(file, after, "utf8");
        changed++;
        console.log("updated:", path.relative(ROOT, file));
      }
    }
  } catch {
    /* dir may not exist */
  }
}

console.log(`Done. ${changed} files updated.`);
