import Link from "next/link";
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
          <h1 className="text-3xl font-bold text-ink">Guides</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Walkthroughs that link straight into the tools—built for real tasks like email limits, mobile workflows, and
            sensitive documents.
          </p>
        </header>
        <ul className="grid gap-4 md:grid-cols-2">
          {posts.slice(0, 48).map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}/`}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand/40"
              >
                <span className="font-semibold text-ink">{p.title}</span>
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{p.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
