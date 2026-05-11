/**
 * Pre-generates static Open Graph JPEGs (1200x630) for blog articles at /assets/og/[slug].jpg.
 * Build-time only. Run before generate-blog-pages.mjs.
 *
 * Env:
 *   OPENAI_API_KEY — optional; when set with OG_AI_HOOKS=1, fills missing hooks into og-ai-hook-cache.json
 *   OG_AI_HOOKS=1 — enable AI hook generation for uncached slugs
 *   OG_AI_MAX=25 — max AI calls per run (default 25)
 *
 * Flags:
 *   --ab — also write /assets/og/variants/[slug]-b.jpg (alternate pool hook for A/B tests)
 */

import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildOgSvg,
  deriveCategoryLabel,
  deriveContentType,
  fetchAiHook,
  ogDisplayTitle,
  resolveHook,
  svgToJpeg1200,
} from "./lib/viral-og.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const blogJsonPath = path.join(root, "assets", "data", "blog.json");
const hookOverridesPath = path.join(root, "assets", "data", "og-hook-overrides.json");
const aiHookCachePath = path.join(root, "assets", "data", "og-ai-hook-cache.json");
const manifestPath = path.join(root, "assets", "data", "og-manifest.json");
const ogDir = path.join(root, "assets", "og");
const variantsDir = path.join(ogDir, "variants");

const abFlag = process.argv.includes("--ab");

async function readJsonOptional(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJpegOrFallback(svg, destPath, defaultPath) {
  try {
    const buf = await svgToJpeg1200(svg);
    await writeFile(destPath, buf);
    return true;
  } catch (err) {
    console.warn("OG rasterize failed:", destPath, err.message || err);
    try {
      await copyFile(defaultPath, destPath);
      return false;
    } catch (e2) {
      console.warn("OG fallback copy failed:", destPath, e2.message || e2);
      return false;
    }
  }
}

async function generateDefault(defaultPath) {
  const svg = buildOgSvg({
    title: "JoinMyPDF Blog",
    hook: "Tips tools and PDF guides for everyone",
    categoryBadge: "Blog",
    contentType: "guide",
  });
  const buf = await svgToJpeg1200(svg);
  await writeFile(defaultPath, buf);
}

async function maybeFillAiHooks(posts, aiCache, hookOverrides, maxCalls) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || process.env.OG_AI_HOOKS !== "1") return aiCache;
  let used = 0;
  const next = { ...aiCache };
  for (const post of posts) {
    if (used >= maxCalls) break;
    const slug = post.slug;
    if (!slug || next[slug] || (hookOverrides[slug] && hookOverrides[slug].trim())) continue;
    if (post.seo && post.seo.ogHook) continue;
    const contentType = deriveContentType(post);
    const categoryLabel = deriveCategoryLabel(post);
    const hook = await fetchAiHook(post, contentType, categoryLabel);
    if (hook) {
      next[slug] = hook;
      used += 1;
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  if (used > 0) {
    await writeFile(aiHookCachePath, JSON.stringify({ bySlug: next }, null, 2), "utf8");
    console.log(`AI hooks written: ${used} (see og-ai-hook-cache.json)`);
  }
  return next;
}

function slugToSyntheticPost(slug) {
  const title = slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return { slug, title, keyword: title.toLowerCase() };
}

async function main() {
  const blogRegistry = JSON.parse(await readFile(blogJsonPath, "utf8"));
  const posts = blogRegistry.blog || [];
  const hookFile = await readJsonOptional(hookOverridesPath, {});
  const hookOverrides = hookFile.bySlug || {};
  let aiFile = await readJsonOptional(aiHookCachePath, {});
  let aiCache = aiFile.bySlug || {};

  const aiMax = Math.max(0, Number(process.env.OG_AI_MAX || 25));
  aiCache = await maybeFillAiHooks(posts, aiCache, hookOverrides, aiMax);

  await mkdir(ogDir, { recursive: true });
  await mkdir(variantsDir, { recursive: true });
  const defaultPath = path.join(ogDir, "default.jpg");
  try {
    await generateDefault(defaultPath);
  } catch (err) {
    console.error("Failed to build OG default.jpg:", err);
    process.exit(1);
  }

  const manifestItems = [];
  const known = new Set(posts.map((p) => p.slug));

  async function processPost(post) {
    const contentType = deriveContentType(post);
    const categoryBadge = deriveCategoryLabel(post);
    const title = ogDisplayTitle(post);
    const hookA = resolveHook(post, contentType, {
      variant: "a",
      overrides: hookOverrides,
      aiCache,
    });
    const svgA = buildOgSvg({ title, hook: hookA, categoryBadge, contentType });
    const primaryPath = path.join(ogDir, `${post.slug}.jpg`);
    const okA = await writeJpegOrFallback(svgA, primaryPath, defaultPath);
    manifestItems.push({
      slug: post.slug,
      contentType,
      categoryBadge,
      hook: hookA,
      variant: "a",
      ok: okA,
    });

    if (abFlag) {
      const hookB = resolveHook(post, contentType, {
        variant: "b",
        overrides: hookOverrides,
        aiCache,
      });
      if (hookB !== hookA) {
        const svgB = buildOgSvg({ title, hook: hookB, categoryBadge, contentType });
        const bPath = path.join(variantsDir, `${post.slug}-b.jpg`);
        const okB = await writeJpegOrFallback(svgB, bPath, defaultPath);
        manifestItems.push({
          slug: post.slug,
          contentType,
          categoryBadge,
          hook: hookB,
          variant: "b",
          ok: okB,
        });
      }
    }
  }

  const chunk = 6;
  for (let i = 0; i < posts.length; i += chunk) {
    await Promise.all(posts.slice(i, i + chunk).map((p) => processPost(p)));
  }

  const entries = await readdir(path.join(root, "blog"), { withFileTypes: true });
  const orphans = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name === "template") continue;
    if (known.has(e.name)) continue;
    const idx = path.join(root, "blog", e.name, "index.html");
    try {
      await readFile(idx);
    } catch {
      continue;
    }
    orphans.push(slugToSyntheticPost(e.name));
  }
  for (let i = 0; i < orphans.length; i += chunk) {
    await Promise.all(orphans.slice(i, i + chunk).map((p) => processPost(p)));
  }

  await writeFile(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        abVariants: Boolean(abFlag),
        items: manifestItems,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(
    `OG images: ${manifestItems.length} manifest rows; output ${ogDir}` +
      (abFlag ? " (+ A/B variant JPEGs)" : "")
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
