import { access, constants, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const blogJsonPath = path.join(root, "assets", "data", "blog.json");
const toolsJsonPath = path.join(root, "assets", "data", "tools.json");
const blogTemplatePath = path.join(root, "blog", "template", "index.html");
const blogRoot = path.join(root, "blog");

function escapeAttr(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeBaseUrl(url) {
  const trimmed = String(url || "https://joinmypdf.com").replace(/\/+$/, "");
  return trimmed || "https://joinmypdf.com";
}

function resolveOgImagePath(post) {
  const slug = post.slug || "";
  if (!slug) return "/assets/og/default.jpg";
  const variant = post.seo && post.seo.ogVariant === "b" ? "b" : "a";
  const variantFile = path.join(root, "assets", "og", "variants", `${slug}-b.jpg`);
  const primaryFile = path.join(root, "assets", "og", `${slug}.jpg`);
  const defaultFile = path.join(root, "assets", "og", "default.jpg");
  const legacyDefault = path.join(root, "assets", "images", "blog", "og-default.jpg");
  if (variant === "b" && existsSync(variantFile)) return `/assets/og/variants/${slug}-b.jpg`;
  if (existsSync(primaryFile)) return `/assets/og/${slug}.jpg`;
  if (existsSync(defaultFile)) return "/assets/og/default.jpg";
  if (existsSync(legacyDefault)) return "/assets/images/blog/og-default.jpg";
  return "/assets/og/default.jpg";
}

function buildArticleSeo(post, baseUrl) {
  const pageTitle =
    post.seo && post.seo.metaTitle ? post.seo.metaTitle : `${post.title} | JoinMyPDF Blog`;
  const description =
    post.seo && post.seo.metaDescription
      ? post.seo.metaDescription
      : post.description ||
        `Learn ${post.keyword} with a practical guide, linked tools, and workflow tips from JoinMyPDF.`;
  const pathname = `/blog/${post.slug}/`;
  const canonical = new URL(pathname, `${baseUrl}/`).href;
  let ogImage;
  if (post.seo && post.seo.ogImage) {
    ogImage = /^https?:\/\//i.test(post.seo.ogImage)
      ? post.seo.ogImage
      : new URL(post.seo.ogImage, `${baseUrl}/`).href;
  } else {
    const imagePath = resolveOgImagePath(post);
    ogImage = new URL(imagePath, `${baseUrl}/`).href;
  }
  return { pageTitle, description, canonical, ogImage };
}

function applyArticleSeoToTemplate(html, seo) {
  return html
    .replaceAll("__BLOG_META_TITLE__", escapeAttr(seo.pageTitle))
    .replaceAll("__BLOG_META_DESC__", escapeAttr(seo.description))
    .replaceAll("__BLOG_CANONICAL__", escapeAttr(seo.canonical))
    .replaceAll("__BLOG_OG_IMAGE__", escapeAttr(seo.ogImage));
}

function slugToDisplayTitle(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function syntheticPostFromSlug(slug) {
  const title = slugToDisplayTitle(slug);
  return {
    slug,
    title,
    keyword: title.toLowerCase(),
    description: `JoinMyPDF guide: ${title}. Browser-based PDF tools, practical workflows, and tips — no upload required for standard tasks.`,
  };
}

const toolsRegistry = JSON.parse(await readFile(toolsJsonPath, "utf8"));
const blogRegistry = JSON.parse(await readFile(blogJsonPath, "utf8"));
const template = await readFile(blogTemplatePath, "utf8");
const baseUrl = normalizeBaseUrl(toolsRegistry.site && toolsRegistry.site.baseUrl);
const registryPosts = blogRegistry.blog || [];
const knownSlugs = new Set(registryPosts.map((post) => post.slug));

for (const post of registryPosts) {
  const targetDir = path.join(blogRoot, post.slug);
  await mkdir(targetDir, { recursive: true });
  const seo = buildArticleSeo(post, baseUrl);
  const html = applyArticleSeoToTemplate(template, seo);
  await writeFile(path.join(targetDir, "index.html"), html, "utf8");
}

let orphanArticles = 0;
const dirEntries = await readdir(blogRoot, { withFileTypes: true });
for (const entry of dirEntries) {
  if (!entry.isDirectory()) continue;
  const slug = entry.name;
  if (slug === "template") continue;
  if (knownSlugs.has(slug)) continue;
  const indexPath = path.join(blogRoot, slug, "index.html");
  try {
    await access(indexPath, constants.F_OK);
  } catch {
    continue;
  }
  orphanArticles += 1;
  const seo = buildArticleSeo(syntheticPostFromSlug(slug), baseUrl);
  await writeFile(indexPath, applyArticleSeoToTemplate(template, seo), "utf8");
}

console.log(
  `Blog pages generated: ${registryPosts.length} from blog.json` +
    (orphanArticles ? `; ${orphanArticles} legacy article folders updated` : "")
);
