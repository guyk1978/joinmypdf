import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ArticleAuthorBadge } from "@/components/ArticleAuthorBadge";
import { BlogArticleBody } from "@/components/BlogArticleBody";
import { BlogArticleToc } from "@/components/BlogArticleToc";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { HomePageSeamlessBg } from "@/components/HomePageSeamlessBg";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getBlogCategoryBadgeClass,
  resolveBlogDisplayCategory,
} from "@/lib/blog-categories";
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

  const category = resolveBlogDisplayCategory(post);
  const categoryLabel = getLocalizedBlogCategoryLabel(post, t);
  const categoryBadgeClass = getBlogCategoryBadgeClass(category);
  const readTime = getLocalizedBlogReadTime(post, t);
  const showToc = sections.length >= 3;

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
      <div className="home-page-shell min-h-screen text-neutral-900 dark:text-neutral-100">
        <HomePageSeamlessBg />
        <SiteHeader />
        <main className="article-page">
          <div className="article-page__layout mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14 lg:max-w-7xl">
            <div
              className={
                showToc
                  ? "article-page__grid lg:grid lg:grid-cols-[minmax(0,48rem)_15rem] lg:items-start lg:justify-center lg:gap-x-14 xl:gap-x-16"
                  : "article-page__grid article-page__grid--solo mx-auto max-w-3xl"
              }
            >
              <article className="article-page__content min-w-0">
                <header className="article-header mx-auto max-w-3xl text-center lg:text-start">
                  <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                    <span className={categoryBadgeClass}>{categoryLabel}</span>
                    {post.readTime ? (
                      <span className="text-sm text-neutral-500">{readTime}</span>
                    ) : null}
                  </div>

                  <h1 className="article-header__title mt-5">{displayTitle}</h1>

                  {post.publishDate ? (
                    <p className="article-header__meta mt-4 text-sm text-neutral-500">
                      {t("article.updated", { date: post.publishDate })}
                    </p>
                  ) : null}

                  <div className="mt-6 flex justify-center lg:justify-start">
                    <ArticleAuthorBadge post={post} className="w-full max-w-lg" />
                  </div>

                  {post.contentBlocks?.intro ? (
                    <p className="article-lead mt-8">{post.contentBlocks.intro}</p>
                  ) : null}

                  {post.contentBlocks?.editorialNote ? (
                    <p className="article-note mt-4 text-sm leading-relaxed text-neutral-500">
                      {post.contentBlocks.editorialNote}
                    </p>
                  ) : null}
                </header>

                {showToc ? (
                  <div className="article-toc-mobile mx-auto mt-10 max-w-3xl lg:hidden">
                    <BlogArticleToc sections={sections} />
                  </div>
                ) : null}

                <div className="article-main mx-auto mt-10 max-w-3xl">
                  <BlogArticleBody post={post} />

                  {tools.length ? (
                    <section className="article-panel mt-16 md:mt-20" aria-labelledby="workflow-tools">
                      <h2 id="workflow-tools" className="article-panel__title">
                        {t("article.toolsInWorkflow")}
                      </h2>
                      <div className="mt-8">
                        <CompactToolCardGrid
                          variant="glass"
                          className="gap-4 md:grid-cols-2 lg:grid-cols-3"
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
                    <section className="article-panel mt-16 md:mt-20" id="faq">
                      <h2 className="article-panel__title">{t("article.faqTitle")}</h2>
                      <div className="mt-8 flex flex-col gap-4">
                        {faqs.map((f) => (
                          <details key={f.q} className="article-faq-item group">
                            <summary className="article-faq-item__summary">{f.q}</summary>
                            <p className="article-faq-item__body">{f.a}</p>
                          </details>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {relatedArticles.length ? (
                    <section className="article-panel mt-16 md:mt-20" aria-labelledby="related-articles">
                      <h2 id="related-articles" className="article-panel__title">
                        {t("article.relatedArticles")}
                      </h2>
                      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                        {relatedArticles.map((related) => (
                          <li key={related.slug}>
                            <Link
                              href={`/blog/${related.slug}/`}
                              className="article-related-card group block h-full"
                              prefetch={false}
                            >
                              <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                                {getLocalizedBlogCategoryLabel(related, t)}
                              </p>
                              <p className="mt-2 text-base font-semibold leading-snug text-neutral-100 transition-colors group-hover:text-white">
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
                    <section className="article-panel mt-16 md:mt-20" aria-labelledby="related-pages">
                      <h2 id="related-pages" className="article-panel__title">
                        {t("article.relatedPages")}
                      </h2>
                      <ul className="mt-8 flex flex-wrap gap-3">
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
                    <div className="article-cta mt-16 flex justify-center md:mt-20">
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

              {showToc ? (
                <aside className="article-page__toc hidden lg:block" aria-label={t("tocAriaLabel")}>
                  <BlogArticleToc sections={sections} sticky />
                </aside>
              ) : null}
            </div>
          </div>
        </main>
        <SiteFooter tagline="blog" />
      </div>
    </>
  );
}
