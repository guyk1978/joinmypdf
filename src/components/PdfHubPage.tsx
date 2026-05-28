import Link from "next/link";
import { BlogGuideCard } from "@/components/BlogGuideCard";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { postsForHub, type PdfHub } from "@/lib/pdf-hubs";
import { registry } from "@/lib/registry";
import type { BlogPost, ToolDefinition } from "@/lib/types";

export function PdfHubPage({ hub }: { hub: PdfHub }) {
  const { featured, more } = postsForHub(hub);
  const allPosts = [...featured, ...more].filter((post): post is BlogPost => Boolean(post));
  const toolItems = Array.from(new Set(allPosts.flatMap((post) => post.relatedTools || [])))
    .map((slug) => registry.tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolDefinition => Boolean(tool))
    .slice(0, 12)
    .map((tool) => ({
      href: `/tools/${tool.slug}/`,
      label: tool.title,
      slugHint: tool.slug,
    }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 md:px-6 md:py-14">
        <header className="max-w-3xl space-y-3 border-b border-slate-200 pb-8 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Hub</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">{hub.title}</h1>
          <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">{hub.description}</p>
          <nav className="flex flex-wrap gap-2 pt-2 text-sm">
            <Link href="/pdf-guides/" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Guides
            </Link>
            <span className="text-slate-400">·</span>
            <Link href="/pdf-comparison/" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Comparisons
            </Link>
            <span className="text-slate-400">·</span>
            <Link href="/pdf-privacy/" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Privacy
            </Link>
            <span className="text-slate-400">·</span>
            <Link href="/pdf-workflows/" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Workflows
            </Link>
          </nav>
        </header>

        <WattQuickCrossLink />

        {featured.length ? (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Featured guides</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((post, index) => (
                <BlogGuideCard key={post!.slug} post={post!} index={index} />
              ))}
            </div>
          </section>
        ) : null}

        {more.length ? (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">More in this topic</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {more.map((post, index) => (
                <BlogGuideCard key={post.slug} post={post} index={featured.length + index} />
              ))}
            </div>
          </section>
        ) : null}

        {toolItems.length ? (
          <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Related tools</h2>
            <CompactToolCardGrid items={toolItems} />
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
