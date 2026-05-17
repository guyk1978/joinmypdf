import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { postsForHub, type PdfHub } from "@/lib/pdf-hubs";
import type { BlogPost } from "@/lib/types";

function PostCard({ post }: { post: BlogPost }) {
  const title = post.seo?.metaTitle || post.title;
  const desc = post.seo?.metaDescription || post.description || "";
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-brand/30">
      <Link href={`/blog/${post.slug}/`} className="block space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {post.tier1 ? (
            <span className="rounded-md bg-brand/15 px-2 py-0.5 text-xs font-semibold text-brand">
              Editorial
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-ink-muted line-clamp-2">{desc}</p>
        {post.contentBlocks?.wordCount ? (
          <p className="text-xs text-ink-muted">{post.contentBlocks.wordCount} words</p>
        ) : null}
      </Link>
    </li>
  );
}

export function PdfHubPage({ hub }: { hub: PdfHub }) {
  const { featured, more } = postsForHub(hub);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl space-y-12 px-4 py-10 md:px-6">
        <header className="space-y-3 border-b border-white/10 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Hub</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">{hub.title}</h1>
          <p className="max-w-2xl text-lg text-ink-muted">{hub.description}</p>
          <nav className="flex flex-wrap gap-2 pt-2 text-sm">
            <Link href="/pdf-guides/" className="text-brand hover:underline">
              Guides
            </Link>
            <span className="text-ink-muted">·</span>
            <Link href="/pdf-comparison/" className="text-brand hover:underline">
              Comparisons
            </Link>
            <span className="text-ink-muted">·</span>
            <Link href="/pdf-privacy/" className="text-brand hover:underline">
              Privacy
            </Link>
            <span className="text-ink-muted">·</span>
            <Link href="/pdf-workflows/" className="text-brand hover:underline">
              Workflows
            </Link>
          </nav>
        </header>

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

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-ink">Tools</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Ready to run a workflow? Start with{" "}
            <Link href="/tools/pdf-merge/" className="text-brand hover:underline">
              merge
            </Link>
            ,{" "}
            <Link href="/tools/pdf-compress/" className="text-brand hover:underline">
              compress
            </Link>
            , or{" "}
            <Link href="/tools/pdf-split/" className="text-brand hover:underline">
              split
            </Link>
            —processed in your browser.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
