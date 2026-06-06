import { BlogGuideCard } from "@/components/BlogGuideCard";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { blogRegistry } from "@/lib/blog-registry";
import type { Metadata } from "next";
export { runtime } from "@/lib/cloudflare-runtime";

export const metadata: Metadata = {
  title: "Guides & tutorials",
  description:
    "Practical JoinMyPDF guides for merge, compress, split, and privacy-first PDF workflows—written for humans.",
  alternates: { canonical: "/blog/" },
};

export default function BlogIndexPage() {
  const posts = [...(blogRegistry.blog || [])].sort(
    (a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Guides &amp; tutorials
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
            Latest Guides &amp; Articles
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Walkthroughs that link straight into the tools—built for real tasks like email limits, mobile workflows, and
            sensitive documents.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <BlogGuideCard key={post.slug} post={post} index={index} />
          ))}
        </div>

        <WattQuickCrossLink className="mt-12" />
      </main>
      <SiteFooter tagline="blog" />
    </>
  );
}
