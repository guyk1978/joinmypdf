import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArticleAuthorBadge } from "@/components/ArticleAuthorBadge";
import { BlogArticleBody } from "@/components/BlogArticleBody";
import { BlogToc } from "@/components/BlogToc";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { getLocalizedBlogBadgeLabel } from "@/lib/blog-card-i18n";
import { blogPostingLd, breadcrumbLd, faqLd, JsonLd } from "@/lib/schema";
import { resolveArticleAuthor } from "@/lib/article-author";
import { getBlogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";
import type { BlogPost } from "@/lib/types";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { readdir } from "node:fs/promises";
import path from "node:path";

export const dynamicParams = false;

const matteSection =
  "rounded-none border border-neutral-300 bg-neutral-200 p-2 dark:border-neutral-800 dark:bg-neutral-900";
const matteInset =
  "rounded-none border border-neutral-300 bg-neutral-100 p-2 dark:border-neutral-800 dark:bg-neutral-950";

function stripNoise(text: string) {
  return text.replace(/\s*\[[^\]]+\]\s*$/, "").trim();
}

function faqItems(post: BlogPost) {
  const raw = post.contentBlocks?.faq || [];
  return raw.map((f) => ({ q: stripNoise(f.q), a: f.a }));
}

export async function generateStaticParams() {
  const slugs = new Set<string>();
  const cwd = typeof process.cwd === "function" ? process.cwd() : "";
  if (!cwd) return [];
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

  for (const post of getBlogRegistry().blog || []) {
    if (post.slug) slugs.add(post.slug);
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!slug) return {};
  const blogRegistry = getBlogRegistry(locale);
  const post = blogRegistry.blog.find((p) => p.slug === slug);
  if (!post) return {};
  const title = post.seo?.metaTitle || post.title;
  const description = post.seo?.metaDescription || post.description || "";
  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}/` },
    robots: { index: true, follow: true },
    openGraph: { title, description, url: `/blog/${slug}/`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (!slug) notFound();
  const blogRegistry = getBlogRegistry(locale);
  const post = blogRegistry.blog.find((p) => p.slug === slug);
  if (!post) notFound();

  const t = await getTranslations("Blog");
  const tTools = await getTranslations("Tools");

  const pathname = `/blog/${slug}/`;
  const description = post.seo?.metaDescription || post.description || "";
  const faqs = faqItems(post);
  const sections = post.contentBlocks?.sections || [];
  const internalLinks = post.contentBlocks?.internalLinks || [];
  const relatedArticles = (post.relatedBlogs || [])
    .map((relatedSlug) => blogRegistry.blog.find((entry) => entry.slug === relatedSlug))
    .filter((entry): entry is BlogPost => Boolean(entry));
  const displayTitle = post.seo?.metaTitle || post.title;
  const author = resolveArticleAuthor(post);
  const tools = (post.relatedTools || [])
    .map((s) => registry.tools.find((tool) => tool.slug === s))
    .filter(Boolean) as typeof registry.tools;

  const categoryLabel =
    post.category ||
    (post.tier1 ? t("article.categoryEditorial") : t("article.categoryGuide"));

  return (
    <>
      <JsonLd
        data={blogPostingLd({
          title: displayTitle,
          description,
          pathname,
          datePublished: post.publishDate,
          authorName: author.name,
          authorRole: author.role,
        })}
      />
      {faqs.length ? <JsonLd data={faqLd(faqs)} /> : null}
      <JsonLd
        data={breadcrumbLd([
          { name: t("breadcrumbs.home"), path: "/" },
          { name: t("breadcrumbs.guides"), path: "/blog/" },
          { name: displayTitle, path: pathname },
        ])}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-2 bg-neutral-100 px-2 py-6 dark:bg-neutral-950 md:px-3">
        <article>
          <header className="space-y-2 border-b border-neutral-300 pb-4 dark:border-neutral-800">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black dark:text-neutral-200">
              {categoryLabel}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-neutral-200 md:text-3xl">
              {displayTitle}
            </h1>
            {post.publishDate || post.readTime ? (
              <p className="text-sm text-black dark:text-neutral-200">
                {post.publishDate ? t("article.updated", { date: post.publishDate }) : null}
                {post.publishDate && post.readTime ? " · " : null}
                {post.readTime ? <>{post.readTime}</> : null}
              </p>
            ) : null}
            <ArticleAuthorBadge post={post} />
            {post.contentBlocks?.intro ? (
              <p className="text-base leading-relaxed text-black dark:text-neutral-200">
                {post.contentBlocks.intro}
              </p>
            ) : null}
            {post.contentBlocks?.editorialNote ? (
              <p className="text-sm text-black dark:text-neutral-200">{post.contentBlocks.editorialNote}</p>
            ) : null}
          </header>

          {sections.length ? (
            <div className="mt-3">
              <BlogToc sections={sections} />
            </div>
          ) : null}

          <BlogArticleBody post={post} />

          {tools.length ? (
            <section className={`mt-4 ${matteSection}`}>
              <h2 className="text-base font-semibold text-black dark:text-neutral-200">
                {t("article.toolsInWorkflow")}
              </h2>
              <div className="mt-2">
                <CompactToolCardGrid
                  items={tools.map((tool) => ({
                    href: `/tools/${tool.slug}/`,
                    label: translateToolItem(tTools, tool.slug, tool.title),
                    slugHint: tool.slug,
                  }))}
                />
              </div>
            </section>
          ) : null}

          {faqs.length ? (
            <section className="mt-4" id="faq">
              <h2 className="text-lg font-semibold text-black dark:text-neutral-200">
                {t("article.faqTitle")}
              </h2>
              <div className="mt-2 space-y-2">
                {faqs.map((f) => (
                  <details key={f.q} className={matteInset}>
                    <summary className="cursor-pointer font-medium text-black dark:text-neutral-200">
                      {f.q}
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-black dark:text-neutral-200">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {relatedArticles.length ? (
            <section className={`mt-4 ${matteSection}`}>
              <h2 className="text-base font-semibold text-black dark:text-neutral-200">
                {t("article.relatedArticles")}
              </h2>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {relatedArticles.map((related) => (
                  <li key={related.slug}>
                    <Link
                      href={`/blog/${related.slug}/`}
                      className={`block ${matteInset} transition hover:border-neutral-500 dark:hover:border-neutral-600`}
                    >
                      {related.category ? (
                        <p className="text-xs font-semibold uppercase tracking-wide text-black dark:text-neutral-200">
                          {getLocalizedBlogBadgeLabel(related, t)}
                        </p>
                      ) : null}
                      <p className="mt-1 font-medium text-black dark:text-neutral-200">{related.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-black dark:text-neutral-200">
                        {related.description || related.seo?.metaDescription}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {internalLinks.length ? (
            <section className={`mt-4 ${matteSection}`}>
              <h2 className="text-base font-semibold text-black dark:text-neutral-200">
                {t("article.relatedPages")}
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {internalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="inline-flex rounded-none border border-neutral-300 bg-neutral-100 px-2 py-1 text-sm text-black transition hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
                      href={link.href}
                    >
                      {link.anchor}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </main>
      <SiteFooter tagline="blog" />
    </>
  );
}
