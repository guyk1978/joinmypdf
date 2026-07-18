import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AppPageShell } from "@/components/AppPageShell";
import { BlogGuideCard } from "@/components/BlogGuideCard";
import { HomeFeaturedSection, HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { postsForHub, type PdfHub } from "@/lib/pdf-hubs";
import { registry } from "@/lib/registry";
import type { BlogPost, ToolDefinition } from "@/lib/types";

export async function PdfHubPage({ hub, locale }: { hub: PdfHub; locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("Guides");
  const tTools = await getTranslations("Tools");

  const { featured, more } = postsForHub(hub);
  const allPosts = [...featured, ...more].filter((post): post is BlogPost => Boolean(post));
  const toolItems = Array.from(new Set(allPosts.flatMap((post) => post.relatedTools || [])))
    .map((slug) => registry.tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolDefinition => Boolean(tool))
    .slice(0, 3)
    .map((tool) => ({
      href: `/tools/${tool.slug}/`,
      label: translateToolItem(tTools, tool.slug, tool.title),
      slugHint: tool.slug,
    }));

  return (
    <AppPageShell mainClassName="guides-learning-page">
      <div className="home-minimal-layout home-minimal-layout--directory page-container">
        <h1 className="home-minimal-tagline">{hub.title}</h1>
        <p className="home-minimal-section__title !mb-6 !text-center !normal-case !tracking-normal">
          {hub.description}
        </p>

        <nav className="mb-8 flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/pdf-guides/" className="home-minimal-section__link">
            {t("navGuides")}
          </Link>
          <Link href="/pdf-comparison/" className="home-minimal-section__link">
            {t("navComparisons")}
          </Link>
          <Link href="/pdf-privacy/" className="home-minimal-section__link">
            {t("navPrivacy")}
          </Link>
          <Link href="/pdf-workflows/" className="home-minimal-section__link">
            {t("navWorkflows")}
          </Link>
        </nav>

        {featured.length ? (
          <section className="home-minimal-section">
            <h2 className="home-minimal-section__title">{t("featuredGuides")}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((post) => (
                <BlogGuideCard key={post!.slug} post={post!} />
              ))}
            </div>
          </section>
        ) : null}

        {more.length ? (
          <section className="home-minimal-section">
            <h2 className="home-minimal-section__title">{t("moreInTopic")}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {more.map((post) => (
                <BlogGuideCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        ) : null}

        {toolItems.length ? (
          <HomeFeaturedSection
            id="hub-related-tools"
            title={t("relatedTools")}
            viewAllHref="/tools/"
            viewAllLabel={t("relatedTools")}
          >
            {toolItems.map((item) => (
              <HomeFeaturedToolCard
                key={item.slugHint}
                href={item.href}
                label={item.label}
                slugHint={item.slugHint}
              />
            ))}
          </HomeFeaturedSection>
        ) : null}
      </div>
    </AppPageShell>
  );
}
