import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ArticleAuthorBadge } from "@/components/ArticleAuthorBadge";
import { AdContainer } from "@/components/AdContainer";
import { BlogArticleBody } from "@/components/BlogArticleBody";
import { BlogArticleTemplate } from "@/components/BlogArticleTemplate";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { AppPageShell } from "@/components/AppPageShell";
import { getLocalizedBlogCategoryLabel, getLocalizedBlogReadTime } from "@/lib/blog-card-i18n";
import { blogPostingLd, breadcrumbLd, faqLd, JsonLd } from "@/lib/schema";
import { resolveArticleAuthor } from "@/lib/article-author";
import { getBlogRegistry } from "@/lib/blog-registry";
import { resolveBlogOgImagePath } from "@/lib/og-images-blog";
import { buildDefaultSocialImages } from "@/lib/og-images";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { registry } from "@/lib/registry";
import { homePrimaryPillBtn, homeSecondaryPillBtn } from "@/lib/tool-ui";
import type { BlogPost } from "@/lib/types";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { readdir } from "node:fs/promises";
import path from "node:path";

export const dynamicParams = false;

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
  const ogImagePath = resolveBlogOgImagePath(post, locale);
  const social = buildDefaultSocialImages(locale, { alt: title, imagePath: ogImagePath });

  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}/` },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: `/blog/${slug}/`,
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
  const internalLinks = post.contentBlocks?.internalLinks || [];
  const relatedArticles = (post.relatedBlogs || [])
    .map((relatedSlug) => blogRegistry.blog.find((entry) => entry.slug === relatedSlug))
    .filter((entry): entry is BlogPost => Boolean(entry));
  const displayTitle = post.seo?.metaTitle || post.title;
  const author = resolveArticleAuthor(post);
  const tools = (post.relatedTools || [])
    .map((s) => registry.tools.find((tool) => tool.slug === s))
    .filter(Boolean) as typeof registry.tools;

  const categoryLabel = getLocalizedBlogCategoryLabel(post, t);
  const readTime = getLocalizedBlogReadTime(post, t);

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
      <AppPageShell mainClassName="guides-learning-page">
        <BlogArticleTemplate>
          <article className="article-template__content">
            <header className="article-header text-center">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="article-header__category">{categoryLabel}</span>
                {post.readTime ? (
                  <span className="article-header__meta text-sm">{readTime}</span>
                ) : null}
              </div>

              <h1 className="article-header__title mt-5">{displayTitle}</h1>

              {post.publishDate ? (
                <p className="article-header__meta mt-4 text-sm">
                  {t("article.updated", { date: post.publishDate })}
                </p>
              ) : null}

              <div className="mt-6 flex justify-center">
                <ArticleAuthorBadge post={post} className="w-full max-w-lg" />
              </div>

              {post.contentBlocks?.intro ? (
                <p className="article-lead mt-8">{post.contentBlocks.intro}</p>
              ) : null}

              {post.contentBlocks?.editorialNote ? (
                <p className="article-note mt-4 text-sm leading-relaxed">
                  {post.contentBlocks.editorialNote}
                </p>
              ) : null}
            </header>

            <div className="article-main">
              <BlogArticleBody post={post} />

              {tools.length ? (
                <section className="article-panel" aria-labelledby="workflow-tools">
                  <h2 id="workflow-tools" className="article-panel__title">
                    {t("article.toolsInWorkflow")}
                  </h2>
                  <div className="article-panel__body">
                    <CompactToolCardGrid
                      variant="glass"
                      className="gap-4 md:grid-cols-2"
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
                <>
                  <AdContainer variant="article" />
                  <section className="article-panel" id="faq">
                    <h2 className="article-panel__title">{t("article.faqTitle")}</h2>
                    <div className="article-panel__body flex flex-col">
                      {faqs.map((f) => (
                        <details key={f.q} className="article-faq-item group">
                          <summary className="article-faq-item__summary">{f.q}</summary>
                          <p className="article-faq-item__body">{f.a}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                </>
              ) : null}

              {relatedArticles.length ? (
                <section className="article-panel" aria-labelledby="related-articles">
                  <h2 id="related-articles" className="article-panel__title">
                    {t("article.relatedArticles")}
                  </h2>
                  <ul className="article-panel__body grid gap-4 sm:grid-cols-2">
                    {relatedArticles.map((related) => (
                      <li key={related.slug}>
                        <Link
                          href={`/blog/${related.slug}/`}
                          className="article-related-card group block h-full"
                          prefetch={false}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            {getLocalizedBlogCategoryLabel(related, t)}
                          </p>
                          <p className="mt-2 text-base font-semibold leading-snug text-white transition-colors group-hover:text-neutral-200 dark:text-white dark:group-hover:text-neutral-200">
                            {related.title}
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-500">
                            {related.description || related.seo?.metaDescription}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {internalLinks.length ? (
                <section className="article-panel" aria-labelledby="related-pages">
                  <h2 id="related-pages" className="article-panel__title">
                    {t("article.relatedPages")}
                  </h2>
                  <ul className="article-panel__body flex flex-wrap gap-3">
                    {internalLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={`${homeSecondaryPillBtn} gap-2 px-6 py-2.5 text-sm`}
                          prefetch={false}
                        >
                          {link.anchor}
                          <ArrowUpRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {tools[0] ? (
                <div className="article-cta flex justify-center">
                  <Link
                    href={`/tools/${tools[0].slug}/`}
                    className={`${homePrimaryPillBtn} gap-2`}
                    prefetch={false}
                  >
                    {t("article.openPrimaryTool", { tool: translateToolItem(tTools, tools[0].slug, tools[0].title) })}
                    <ArrowUpRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  </Link>
                </div>
              ) : null}
            </div>
          </article>
        </BlogArticleTemplate>
      </AppPageShell>
    </>
  );
}
