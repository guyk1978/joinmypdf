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
          <header className="space-y-2.5 border-b border-white/10 pb-5 sm:space-y-3 sm:pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              {post.tier1 ? "Editorial guide" : "Guide"}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">{displayTitle}</h1>
            {post.publishDate ? (
              <p className="text-sm text-ink-muted">Updated {post.publishDate}</p>
            ) : null}
            <ArticleAuthorBadge post={post} />
            {post.contentBlocks?.intro ? (
              <p className="text-lg leading-relaxed text-ink-muted">{post.contentBlocks.intro}</p>
            ) : null}
            {post.contentBlocks?.editorialNote ? (
              <p className="text-sm text-ink-muted/80">{post.contentBlocks.editorialNote}</p>
            ) : null}
          </header>

          {sections.length ? (
            <div className="mt-8">
              <BlogToc sections={sections} />
            </div>
          ) : null}

          <BlogArticleBody post={post} />

          {tools.length ? (
            <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold text-ink">Tools in this workflow</h2>
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
              <h2 className="text-xl font-semibold text-ink">Frequently asked questions</h2>
              <div className="mt-4 space-y-2">
                {faqs.map((f) => (
                  <details
                    key={f.q}
                    className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                  >
                    <summary className="cursor-pointer font-medium text-ink">{f.q}</summary>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {internalLinks.length ? (
            <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-lg font-semibold text-ink">Related pages</h2>
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
      <SiteFooter />
    </>
  );
}
