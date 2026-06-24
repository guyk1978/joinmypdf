import { BlogGuideListItem } from "@/components/BlogGuideListItem";
import { BlogGuidesHero } from "@/components/BlogGuidesHero";
import { AdContainer } from "@/components/AdContainer";
import { HomePageSeamlessBg } from "@/components/HomePageSeamlessBg";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getBlogRegistry } from "@/lib/blog-registry";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
export const runtime = "edge";

const GUIDE_AD_INTERVAL = 9;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `/${locale}/blog` },
  };
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Blog");

  const blogRegistry = getBlogRegistry(locale);
  const posts = [...(blogRegistry.blog || [])].sort(
    (a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""),
  );

  const listItems = posts.flatMap((post, index) => {
    const nodes = [
      <li key={post.slug}>
        <BlogGuideListItem post={post} />
      </li>,
    ];

    const isInterval = (index + 1) % GUIDE_AD_INTERVAL === 0;
    const hasMore = index < posts.length - 1;
    if (isInterval && hasMore) {
      nodes.push(
        <li key={`guide-ad-${index}`} className="guide-list__ad">
          <AdContainer variant="article" />
        </li>,
      );
    }

    return nodes;
  });

  return (
    <>
      <div className="home-page-shell min-h-screen text-black dark:text-white">
        <HomePageSeamlessBg />
        <SiteHeader />
        <main className="guides-learning-page">
          <BlogGuidesHero />

          <div className="guides-learning-content mx-auto w-full max-w-3xl px-4 md:px-8">
            {posts.length > 0 ? (
              <section aria-label={t("allGuides")}>
                <ul className="guide-list">{listItems}</ul>
              </section>
            ) : null}

            <WattQuickCrossLink className="mt-12" />
          </div>
        </main>
        <SiteFooter tagline="blog" />
      </div>
    </>
  );
}
