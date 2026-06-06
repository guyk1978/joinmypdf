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
      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 md:px-4 md:py-14">
        <header className="max-w-3xl space-y-3 border-b border-neutral-300 dark:border-neutral-800 pb-8 dark:border-neutral-300 dark:border-neutral-800">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">Hub</p>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200 md:text-4xl">{hub.title}</h1>
          <p className="text-lg leading-relaxed text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">{hub.description}</p>
          <nav className="flex flex-wrap gap-2 pt-2 text-sm">
            <Link href="/pdf-guides/" className="text-black dark:text-neutral-200 hover:underline dark:text-black dark:text-neutral-200">
              Guides
            </Link>
            <span className="text-black dark:text-neutral-200">·</span>
            <Link href="/pdf-comparison/" className="text-black dark:text-neutral-200 hover:underline dark:text-black dark:text-neutral-200">
              Comparisons
            </Link>
            <span className="text-black dark:text-neutral-200">·</span>
            <Link href="/pdf-privacy/" className="text-black dark:text-neutral-200 hover:underline dark:text-black dark:text-neutral-200">
              Privacy
            </Link>
            <span className="text-black dark:text-neutral-200">·</span>
            <Link href="/pdf-workflows/" className="text-black dark:text-neutral-200 hover:underline dark:text-black dark:text-neutral-200">
              Workflows
            </Link>
          </nav>
        </header>

        <WattQuickCrossLink />

        {featured.length ? (
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">Featured guides</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((post, index) => (
                <BlogGuideCard key={post!.slug} post={post!} index={index} />
              ))}
            </div>
          </section>
        ) : null}

        {more.length ? (
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">More in this topic</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {more.map((post, index) => (
                <BlogGuideCard key={post.slug} post={post} index={featured.length + index} />
              ))}
            </div>
          </section>
        ) : null}

        {toolItems.length ? (
          <section className="space-y-2 rounded-none border border-neutral-300 dark:border-neutral-800 bg-white p-4 dark:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-200 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">Related tools</h2>
            <CompactToolCardGrid items={toolItems} />
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
