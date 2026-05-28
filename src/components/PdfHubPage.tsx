import Link from "next/link";
import { CalnexAppCrossLink } from "@/components/partner/CalnexAppCrossLink";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { postsForHub, type PdfHub } from "@/lib/pdf-hubs";
import { registry } from "@/lib/registry";
import type { BlogPost, ToolDefinition } from "@/lib/types";

function PostCard({ post }: { post: BlogPost }) {
  const title = post.seo?.metaTitle || post.title;
  const desc = post.seo?.metaDescription || post.description || "";
  return (
    <li className="rounded-xl border border-slate-200/60 bg-white p-5 transition hover:border-brand/30 dark:border-slate-800 dark:bg-slate-900">
      <Link href={`/blog/${post.slug}/`} className="block space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          {post.tier1 ? (
            <span className="rounded-md bg-brand/15 px-2 py-0.5 text-xs font-semibold text-brand">
              Editorial
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{desc}</p>
        {post.contentBlocks?.wordCount ? (
          <p className="text-xs text-slate-600 dark:text-slate-400">{post.contentBlocks.wordCount} words</p>
        ) : null}
      </Link>
    </li>
  );
}

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
      <main className="mx-auto max-w-4xl space-y-12 px-4 py-10 md:px-6">
        <header className="space-y-3 border-b border-slate-200 pb-8 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Hub</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">{hub.title}</h1>
          <p className="max-w-2xl text-lg text-slate-700 dark:text-slate-300">{hub.description}</p>
          <nav className="flex flex-wrap gap-2 pt-2 text-sm">
            <Link href="/pdf-guides/" className="text-brand hover:underline">
              Guides
            </Link>
            <span className="text-slate-600 dark:text-slate-400">·</span>
            <Link href="/pdf-comparison/" className="text-brand hover:underline">
              Comparisons
            </Link>
            <span className="text-slate-600 dark:text-slate-400">·</span>
            <Link href="/pdf-privacy/" className="text-brand hover:underline">
              Privacy
            </Link>
            <span className="text-slate-600 dark:text-slate-400">·</span>
            <Link href="/pdf-workflows/" className="text-brand hover:underline">
              Workflows
            </Link>
          </nav>
        </header>

        <CalnexAppCrossLink />

        {featured.length ? (
          <section>
            <h2 className="text-xl font-semibold text-ink">Featured guides</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {featured.map((post) => (
                <PostCard key={post!.slug} post={post!} />
              ))}
            </ul>
          </section>
        ) : null}

        {more.length ? (
          <section>
            <h2 className="text-xl font-semibold text-ink">More in this topic</h2>
            <ul className="mt-4 space-y-3">
              {more.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </ul>
          </section>
        ) : null}

        {toolItems.length ? (
          <section className="space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tools</h2>
            <CompactToolCardGrid items={toolItems} />
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
