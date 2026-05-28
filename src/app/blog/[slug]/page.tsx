import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleAuthorBadge } from "@/components/ArticleAuthorBadge";
import { BlogArticleBody } from "@/components/BlogArticleBody";
import { BlogToc } from "@/components/BlogToc";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { blogPostingLd, breadcrumbLd, faqLd, JsonLd } from "@/lib/schema";
import { resolveArticleAuthor } from "@/lib/article-author";
import { blogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";
import type { BlogPost } from "@/lib/types";
import type { Metadata } from "next";

function stripNoise(text: string) {
  return text.replace(/\s*\[[^\]]+\]\s*$/, "").trim();
}

function faqItems(post: BlogPost) {
  const raw = post.contentBlocks?.faq || [];
  return raw.map((f) => ({ q: stripNoise(f.q), a: f.a }));
}

export function generateStaticParams() {
  return (blogRegistry.blog || []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogRegistry.blog.find((p) => p.slug === slug);
  if (!post) notFound();
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
    .map((s) => registry.tools.find((t) => t.slug === s))
    .filter(Boolean) as typeof registry.tools;

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
          { name: "Home", path: "/" },
          { name: "Guides", path: "/blog/" },
          { name: displayTitle, path: pathname },
        ])}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 md:px-6">
        <article>
          <header className="space-y-2.5 border-b border-slate-200/80 pb-5 sm:space-y-3 sm:pb-6 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              {post.category || (post.tier1 ? "Editorial guide" : "Guide")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">{displayTitle}</h1>
            {post.publishDate || post.readTime ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {post.publishDate ? <>Updated {post.publishDate}</> : null}
                {post.publishDate && post.readTime ? " · " : null}
                {post.readTime ? <>{post.readTime}</> : null}
              </p>
            ) : null}
            <ArticleAuthorBadge post={post} />
            {post.contentBlocks?.intro ? (
              <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">{post.contentBlocks.intro}</p>
            ) : null}
            {post.contentBlocks?.editorialNote ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{post.contentBlocks.editorialNote}</p>
            ) : null}
          </header>

          {sections.length ? (
            <div className="mt-8">
              <BlogToc sections={sections} />
            </div>
          ) : null}

          <BlogArticleBody post={post} />

          {tools.length ? (
            <section className="mt-10 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tools in this workflow</h2>
              <ul className="mt-3 space-y-2">
                {tools.map((t) => (
                  <li key={t.slug}>
                    <Link className="font-medium text-brand hover:underline" href={`/tools/${t.slug}/`}>
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {faqs.length ? (
            <section className="mt-10" id="faq">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Frequently asked questions</h2>
              <div className="mt-4 space-y-2">
                {faqs.map((f) => (
                  <details
                    key={f.q}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/40"
                  >
                    <summary className="cursor-pointer font-medium text-slate-900 dark:text-white">{f.q}</summary>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {relatedArticles.length ? (
            <section className="mt-10 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Related articles</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {relatedArticles.map((related) => (
                  <li key={related.slug}>
                    <Link
                      href={`/blog/${related.slug}/`}
                      className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-brand/40 dark:border-slate-700 dark:bg-slate-800/40"
                    >
                      {related.category ? (
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                          {related.category}
                        </p>
                      ) : null}
                      <p className="mt-1 font-medium text-slate-900 dark:text-white">{related.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {related.description || related.seo?.metaDescription}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {internalLinks.length ? (
            <section className="mt-10 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Related pages</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {internalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="inline-flex rounded-lg border border-white/15 px-3 py-1.5 text-sm text-brand hover:bg-white/5"
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
