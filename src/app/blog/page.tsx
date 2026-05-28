import Link from "next/link";
import { CalnexAppCrossLink } from "@/components/partner/CalnexAppCrossLink";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { blogRegistry } from "@/lib/blog-registry";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guides & tutorials",
  description:
    "Practical JoinMyPDF guides for merge, compress, split, and privacy-first PDF workflows—written for humans.",
  alternates: { canonical: "/blog/" },
};

export default function BlogIndexPage() {
  const posts = [...(blogRegistry.blog || [])].sort(
    (a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || "")
  );
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Guides</h1>
          <p className="mt-2 max-w-2xl text-slate-700 dark:text-slate-300">
            Walkthroughs that link straight into the tools—built for real tasks like email limits, mobile workflows, and
            sensitive documents.
          </p>
        </header>
        <CalnexAppCrossLink className="max-w-2xl" />
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}/`}
                className="blog-card block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand/40"
              >
                {p.category ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">{p.category}</p>
                ) : null}
                <span className="mt-1 block font-semibold text-ink">{p.title}</span>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                  {p.description || p.seo?.metaDescription}
                </p>
                <p className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted/80">
                  {p.publishDate ? <span>{p.publishDate}</span> : null}
                  {p.readTime ? <span aria-hidden="true">·</span> : null}
                  {p.readTime ? <span>{p.readTime}</span> : null}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter tagline="blog" />
    </>
  );
}
