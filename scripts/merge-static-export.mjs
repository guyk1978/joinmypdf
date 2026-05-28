/**
 * After `next build` (output: export), merges programmatic SEO HTML trees into `out/`
 * without touching `out/index.html` (owned by Next.js App Router).
 */
import { cp, mkdir, access, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "out");
const generatedOutPaths = [path.join(outDir, "blog"), path.join(outDir, "tools")];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(outDir))) {
    console.error("merge-static-export: out/ not found — run next build first.");
    process.exit(1);
  }

  for (const target of generatedOutPaths) {
    await rm(target, { recursive: true, force: true });
  }

  const copies = [
    { from: "blog", to: "blog" },
    { from: "tools", to: "tools" },
  ];

  for (const { from, to } of copies) {
    const src = path.join(root, from);
    const dest = path.join(outDir, to);
    if (!(await exists(src))) {
      console.warn(`skip missing ${from}/`);
      continue;
    }
    await mkdir(path.dirname(dest), { recursive: true });
    await cp(src, dest, {
      recursive: true,
      force: true,
      filter: (sourcePath) => path.extname(sourcePath).toLowerCase() !== ".txt",
    });
    console.log(`merged ${from}/ → out/${to}/`);
  }

  const rootIndex = path.join(outDir, "index.html");
  if (await exists(rootIndex)) {
    console.log("out/index.html preserved (Next.js homepage).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
