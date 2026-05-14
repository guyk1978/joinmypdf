import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { blogPostingLd, breadcrumbLd, faqLd, JsonLd } from "@/lib/schema";
import { blogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";
import type { BlogPost } from "@/lib/types";
import type { Metadata } from "next";

function stripNoise(text: string) {
  return text.replace(/\s*\[[^\]]+\]\s*$/, "").trim();
}

function bodyParagraphs(post: BlogPost): string[] {
  const body = post.contentBlocks?.body;
  if (!body) {
    const intro = post.contentBlocks?.intro || post.description || "";
    return intro ? [intro] : [];
  }
  if (Array.isArray(body)) return body.map(String);
  return String(body)
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
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
  const paras = bodyParagraphs(post);
  const tools = (post.relatedTools || [])
    .map((s) => registry.tools.find((t) => t.slug === s))
    .filter(Boolean) as typeof registry.tools;

  return (
    <>
      <JsonLd
        data={blogPostingLd({
          title: post.title,
          description,
          pathname,
          datePublished: post.publishDate,
        })}
      />
      {faqs.length ? <JsonLd data={faqLd(faqs)} /> : null}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/blog/" },
          { name: post.title, path: pathname },
        ])}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 md:px-6">
        <article>
          <header className="space-y-2 border-b border-white/10 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Guide</p>
            <h1 className="text-3xl font-bold text-ink md:text-4xl">{post.title}</h1>
            {post.publishDate ? <p className="text-sm text-ink-muted">Updated {post.publishDate}</p> : null}
            {post.contentBlocks?.intro ? (
              <p className="text-lg text-ink-muted">{post.contentBlocks.intro}</p>
            ) : null}
          </header>
          <div className="mt-8 max-w-none space-y-5 text-sm leading-relaxed text-ink-muted md:text-base">
            {paras.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {tools.length ? (
            <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold text-ink">Tools in this workflow</h2>
              <ul className="mt-3 space-y-2">
                {tools.map((t) => (
                  <li key={t.slug}>
                    <Link className="text-brand hover:underline" href={`/tools/${t.slug}/`}>
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {faqs.length ? (
            <section className="mt-10">
              <h2 className="text-xl font-semibold text-ink">FAQ</h2>
              <div className="mt-4 space-y-2">
                {faqs.map((f) => (
                  <details key={f.q} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                    <summary className="cursor-pointer font-medium text-ink">{f.q}</summary>
                    <p className="mt-2 text-sm text-ink-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
