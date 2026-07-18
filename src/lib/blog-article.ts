import { readdir } from "node:fs/promises";
import path from "node:path";
import { blogArticlePath } from "@/lib/blog-article-path";
import { getBlogRegistry } from "@/lib/blog-registry";
import { resolveBlogOgImagePath } from "@/lib/og-images-blog";
import { buildDefaultSocialImages } from "@/lib/og-images";
import type { BlogPost } from "@/lib/types";
import type { Metadata } from "next";

export { blogArticlePath } from "@/lib/blog-article-path";

export function stripBlogNoise(text: string) {
  return text.replace(/\s*\[[^\]]+\]\s*$/, "").trim();
}

export function blogArticleFaqItems(post: BlogPost) {
  const raw = post.contentBlocks?.faq || [];
  return raw.map((f) => ({ q: stripBlogNoise(f.q), a: f.a }));
}

export async function generateBlogArticleStaticParams() {
  const slugs = new Set<string>();
  const cwd = typeof process.cwd === "function" ? process.cwd() : "";
  if (cwd) {
    const blogRoot = path.join(cwd, "blog");
    try {
      const entries = await readdir(blogRoot, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const slug = entry.name;
        if (!slug || slug === "index") continue;
        slugs.add(slug);
      }
    } catch {
      // Fall back to JSON-derived slugs below.
    }
  }

  for (const post of getBlogRegistry().blog || []) {
    if (post.slug) slugs.add(post.slug);
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export function resolveBlogArticlePost(locale: string, slug: string): BlogPost | undefined {
  if (!slug) return undefined;
  return getBlogRegistry(locale).blog.find((p) => p.slug === slug);
}

export async function generateBlogArticleMetadata({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}): Promise<Metadata> {
  if (!slug) return {};
  const post = resolveBlogArticlePost(locale, slug);
  if (!post) return {};

  const title = post.seo?.metaTitle || post.title;
  const description = post.seo?.metaDescription || post.description || "";
  const keywords = post.seo?.keywords;
  const ogImagePath = resolveBlogOgImagePath(post, locale);
  const social = buildDefaultSocialImages(locale, { alt: title, imagePath: ogImagePath });
  const pathname = blogArticlePath(slug);

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: pathname },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: pathname,
      type: "article",
      ...social.openGraph,
    },
    twitter: {
      title,
      description,
      ...social.twitter,
    },
  };
}
