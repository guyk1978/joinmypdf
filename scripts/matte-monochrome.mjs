#!/usr/bin/env node
/** One-pass matte monochrome refactor: strip accents, shadows, rounding; tighten spacing. */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src");

const REPLACEMENTS = [
  [/\s+shadow-[\w[\]/%.-]+/g, ""],
  [/\s+shadow\b/g, ""],
  [/\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/g, "rounded-none"],
  [/\bbg-blue-\d+\b/g, "bg-neutral-900"],
  [/\bhover:bg-blue-\d+\b/g, "hover:bg-neutral-800"],
  [/\bfocus-visible:outline-brand\b/g, "focus-visible:outline-neutral-500"],
  [/\bfocus-visible:ring-brand\b/g, "focus-visible:ring-neutral-500"],
  [/\btext-blue-\d+\b/g, "text-black dark:text-neutral-200"],
  [/\bborder-blue-\d+\b/g, "border-neutral-300 dark:border-neutral-800"],
  [/\bring-blue-\d+\b/g, "ring-neutral-400 dark:ring-neutral-600"],
  [/\btext-brand(?:\/[\d]+)?\b/g, "text-neutral-800 dark:text-neutral-200"],
  [/\bbg-brand(?:\/[\d]+)?\b/g, "bg-neutral-200 dark:bg-neutral-800"],
  [/\bborder-brand(?:\/[\d]+)?\b/g, "border-neutral-300 dark:border-neutral-800"],
  [/\bring-brand(?:\/[\d]+)?\b/g, "ring-neutral-400 dark:ring-neutral-600"],
  [/\bfrom-blue-\d+\b/g, ""],
  [/\bvia-indigo-\d+\b/g, ""],
  [/\bto-violet-\d+\b/g, ""],
  [/\bbg-gradient-to-[a-z]+\b/g, "bg-neutral-900"],
  [/\btext-sky-\d+\b/g, "text-black dark:text-neutral-200"],
  [/\bbg-sky-\d+\b/g, "bg-neutral-200 dark:bg-neutral-800"],
  [/\bborder-sky-\d+\b/g, "border-neutral-300 dark:border-neutral-800"],
  [/\btext-indigo-\d+\b/g, "text-black dark:text-neutral-200"],
  [/\bbg-indigo-\d+\b/g, "bg-neutral-900"],
  [/\btext-violet-\d+\b/g, "text-black dark:text-neutral-200"],
  [/\bbg-emerald-\d+\b/g, "bg-neutral-900 dark:bg-neutral-200"],
  [/\bhover:bg-emerald-\d+\b/g, "hover:bg-neutral-800 dark:hover:bg-neutral-100"],
  [/\btext-emerald-\d+\b/g, "text-black dark:text-neutral-200"],
  [/\bshadow-emerald-\d+\/\d+\b/g, ""],
  [/\bshadow-sky-\d+\/\d+\b/g, ""],
  [/\bshadow-indigo-\d+\/\d+\b/g, ""],
  [/\btext-slate-900\b/g, "text-black dark:text-neutral-200"],
  [/\btext-slate-800\b/g, "text-black dark:text-neutral-200"],
  [/\btext-slate-700\b/g, "text-black dark:text-neutral-300"],
  [/\btext-slate-600\b/g, "text-neutral-800 dark:text-neutral-400"],
  [/\btext-slate-500\b/g, "text-neutral-700 dark:text-neutral-400"],
  [/\bbg-slate-50\b/g, "bg-neutral-100 dark:bg-neutral-950"],
  [/\bbg-slate-100\b/g, "bg-neutral-100 dark:bg-neutral-900"],
  [/\bborder-slate-200\b/g, "border-neutral-300 dark:border-neutral-800"],
  [/\bborder-slate-300\b/g, "border-neutral-300 dark:border-neutral-800"],
  [/\bborder-slate-700\b/g, "border-neutral-300 dark:border-neutral-800"],
  [/\bbg-\[#0B132B\]\b/g, "bg-neutral-950"],
  [/\bhover:-translate-y-[\d.]+\b/g, ""],
  [/\bhover:scale-\[[\d.]+\]\b/g, ""],
  [/\bp-8\b/g, "p-4"],
  [/\bp-6\b/g, "p-4"],
  [/\bp-5\b/g, "p-3"],
  [/\bpy-8\b/g, "py-4"],
  [/\bpy-6\b/g, "py-3"],
  [/\bpx-8\b/g, "px-4"],
  [/\bpx-6\b/g, "px-4"],
  [/\bgap-8\b/g, "gap-4"],
  [/\bgap-6\b/g, "gap-3"],
  [/\bspace-y-8\b/g, "space-y-4"],
  [/\bspace-y-6\b/g, "space-y-3"],
  [/\bmd:p-6\b/g, "md:p-4"],
  [/\bmd:py-10\b/g, "md:py-5"],
  [/\bxl:gap-10\b/g, "xl:gap-4"],
  [/\bmt-8\b/g, "mt-4"],
  [/\bmb-8\b/g, "mb-4"],
  [/\bpt-8\b/g, "pt-4"],
  [/\bpb-24\b/g, "pb-12"],
  // Pass 2: remaining accents, broken tokens, decorative shadows
  [/\s+from-brand(?:\/[\d]+)?\b/g, ""],
  [/\s+to-brand(?:-deep)?(?:\/[\d]+)?\b/g, ""],
  [/\s+from-emerald-[^\s"'`]+/g, ""],
  [/\s+from-amber-[^\s"'`]+/g, ""],
  [/\s+from-slate-[^\s"'`]+/g, ""],
  [/\s+via-[^\s"'`]+/g, ""],
  [/\s+to-blue-[^\s"'`]+/g, ""],
  [/\s+to-cyan-[^\s"'`]+/g, ""],
  [/\s+to-emerald-[^\s"'`]+/g, ""],
  [/\bneutral-800-deep\b/g, "neutral-700"],
  [/\bborder-cyan-[^\s"'`]+/g, "border-neutral-300 dark:border-neutral-800"],
  [/\btext-cyan-[^\s"'`]+/g, "text-black dark:text-neutral-300"],
  [/\bbg-cyan-[^\s"'`]+/g, "bg-neutral-200 dark:bg-neutral-800"],
  [/\bring-cyan-[^\s"'`]+/g, "ring-neutral-300 dark:ring-neutral-700"],
  [/\bring-sky-[^\s"'`]+/g, "ring-neutral-300 dark:ring-neutral-700"],
  [/\bborder-sky-[^\s"'`]+/g, "border-neutral-300 dark:border-neutral-800"],
  [/\bring-emerald-[^\s"'`]+/g, "ring-neutral-400 dark:ring-neutral-600"],
  [/\bborder-emerald-[^\s"'`]+/g, "border-neutral-300 dark:border-neutral-800"],
  [/\bborder-amber-[^\s"'`]+/g, "border-neutral-400 dark:border-neutral-700"],
  [/\bborder-red-[^\s"'`]+/g, "border-neutral-300 dark:border-neutral-800"],
  [/\bborder-purple-[^\s"'`]+/g, "border-neutral-300 dark:border-neutral-800"],
  [/\bborder-t-blue-[^\s"'`]+/g, "border-t-neutral-800"],
  [/\bborder-t-emerald-[^\s"'`]+/g, "border-t-neutral-600"],
  [/\bborder-t-amber-[^\s"'`]+/g, "border-t-neutral-500"],
  [/\bbg-red-[^\s"'`]+/g, "bg-neutral-200 dark:bg-neutral-800"],
  [/\bbg-amber-[^\s"'`]+/g, "bg-neutral-200 dark:bg-neutral-800"],
  [/\bbg-purple-[^\s"'`]+/g, "bg-neutral-200 dark:bg-neutral-800"],
  [/\btext-red-[^\s"'`]+/g, "text-black dark:text-neutral-200"],
  [/\btext-amber-[^\s"'`]+/g, "text-black dark:text-neutral-200"],
  [/\btext-purple-[^\s"'`]+/g, "text-black dark:text-neutral-200"],
  [/\bfill-blue-[^\s"'`]+/g, "fill-neutral-400/20"],
  [/\bring-(?:purple|amber|red)-[^\s"'`]+/g, "ring-neutral-300 dark:ring-neutral-700"],
  [/\bfill-amber-[^\s"'`]+/g, "fill-neutral-400/25"],
  [/\bhover:shadow-[^\s"'`]+/g, ""],
  [/\bdark:shadow-\[[^\]]+\]/g, ""],
  [/\bshadow-\[[^\]]+\]/g, ""],
  [
    /rounded-none bg-neutral-200 dark:bg-neutral-800 px-5 py-3 text-sm font-semibold text-(?:surface|white)[^"]*hover:bg-neutral-200 dark:bg-neutral-800[^\s"]*[^"]*disabled:cursor-not-allowed disabled:opacity-50/g,
    "rounded-none border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-500 dark:bg-neutral-200 dark:text-neutral-950 dark:hover:bg-white",
  ],
];

const CSS_REPLACEMENTS = [
  [/#2563eb/gi, "#404040"],
  [/#38bdf8/gi, "#a3a3a3"],
  [/#0ea5e9/gi, "#737373"],
  [/#3b82f6/gi, "#525252"],
  [/#eff6ff/gi, "#f5f5f5"],
  [/#1e3a8a/gi, "#171717"],
  [/#172554/gi, "#0a0a0a"],
  [/#bfdbfe/gi, "#d4d4d4"],
  [/#dbeafe/gi, "#e5e5e5"],
  [/#f8fafc/gi, "#f5f5f5"],
  [/#0B132B/gi, "#0a0a0a"],
  [/border-radius:\s*0\.75rem/g, "border-radius: 0"],
  [/border-radius:\s*12px/g, "border-radius: 0"],
  [/border-radius:\s*0\.5rem/g, "border-radius: 0"],
  [/box-shadow:[^;]+;/g, "box-shadow: none;"],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name !== "node_modules" && ent.name !== ".next") walk(p, files);
    } else if (/\.(tsx?|css)$/.test(ent.name)) {
      files.push(p);
    }
  }
  return files;
}

function cleanClasses(s) {
  return s
    .replace(/className="([^"]*)"/g, (_, cls) => {
      const cleaned = cls.replace(/\s+/g, " ").trim();
      return `className="${cleaned}"`;
    })
    .replace(/className=\{`([^`]*)`\}/g, (_, cls) => {
      const cleaned = cls.replace(/\s+/g, " ").trim();
      return `className={\`${cleaned}\`}`;
    });
}

let changed = 0;
for (const file of walk(ROOT)) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;
  for (const [re, rep] of REPLACEMENTS) {
    s = s.replace(re, rep);
  }
  if (file.endsWith(".css")) {
    for (const [re, rep] of CSS_REPLACEMENTS) {
      s = s.replace(re, rep);
    }
  }
  s = cleanClasses(s);
  if (s !== orig) {
    fs.writeFileSync(file, s);
    changed += 1;
  }
}

console.log(`Updated ${changed} files.`);
