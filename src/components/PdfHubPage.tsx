import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BlogGuideCard } from "@/components/BlogGuideCard";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { postsForHub, type PdfHub } from "@/lib/pdf-hubs";
import { registry } from "@/lib/registry";
import type { BlogPost, ToolDefinition } from "@/lib/types";

const matteSection =
  "rounded-none border border-neutral-300 bg-neutral-200 p-2 dark:border-neutral-800 dark:bg-neutral-900";

export async function PdfHubPage({ hub }: { hub: PdfHub }) {
  const t = await getTranslations("Guides");
  const tTools = await getTranslations("Tools");

  const { featured, more } = postsForHub(hub);
  const allPosts = [...featured, ...more].filter((post): post is BlogPost => Boolean(post));
  const toolItems = Array.from(new Set(allPosts.flatMap((post) => post.relatedTools || [])))
    .map((slug) => registry.tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolDefinition => Boolean(tool))
    .slice(0, 12)
    .map((tool) => ({
      href: `/tools/${tool.slug}/`,
      label: translateToolItem(tTools, tool.slug, tool.title),
      slugHint: tool.slug,
    }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-6 bg-neutral-100 px-2 py-6 dark:bg-neutral-950 md:px-3 md:py-8">
        <header className="max-w-3xl space-y-2 border-b border-neutral-300 pb-4 dark:border-neutral-800">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black dark:text-neutral-200">
            {t("hubBadge")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-neutral-200 md:text-3xl">
            {hub.title}
          </h1>
          <p className="text-sm leading-relaxed text-black dark:text-neutral-200">{hub.description}</p>
          <nav className="flex flex-wrap gap-2 pt-1 text-sm">
            <Link href="/pdf-guides/" className="text-black hover:underline dark:text-neutral-200">
              {t("navGuides")}
            </Link>
            <span className="text-black dark:text-neutral-200" aria-hidden="true">
              ·
            </span>
            <Link href="/pdf-comparison/" className="text-black hover:underline dark:text-neutral-200">
              {t("navComparisons")}
            </Link>
            <span className="text-black dark:text-neutral-200" aria-hidden="true">
              ·
            </span>
            <Link href="/pdf-privacy/" className="text-black hover:underline dark:text-neutral-200">
              {t("navPrivacy")}
            </Link>
            <span className="text-black dark:text-neutral-200" aria-hidden="true">
              ·
            </span>
            <Link href="/pdf-workflows/" className="text-black hover:underline dark:text-neutral-200">
              {t("navWorkflows")}
            </Link>
          </nav>
        </header>

        <WattQuickCrossLink />

        {featured.length ? (
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-black dark:text-neutral-200">{t("featuredGuides")}</h2>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((post, index) => (
                <BlogGuideCard key={post!.slug} post={post!} index={index} />
              ))}
            </div>
          </section>
        ) : null}

        {more.length ? (
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-black dark:text-neutral-200">{t("moreInTopic")}</h2>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {more.map((post, index) => (
                <BlogGuideCard key={post.slug} post={post} index={featured.length + index} />
              ))}
            </div>
          </section>
        ) : null}

        {toolItems.length ? (
          <section className={`space-y-2 ${matteSection}`}>
            <h2 className="text-base font-semibold text-black dark:text-neutral-200">{t("relatedTools")}</h2>
            <CompactToolCardGrid items={toolItems} />
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
