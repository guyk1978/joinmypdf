import { BlogGuideCard } from "@/components/BlogGuideCard";
import { BlogGuidesHero } from "@/components/BlogGuidesHero";
import { HomePageSeamlessBg } from "@/components/HomePageSeamlessBg";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getBlogRegistry } from "@/lib/blog-registry";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
export const runtime = "edge";

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

  const featuredPost = posts.find((post) => post.tier1) ?? posts[0] ?? null;
  const gridPosts = featuredPost ? posts.filter((post) => post.slug !== featuredPost.slug) : posts;

  return (
    <>
      <div className="home-page-shell min-h-screen text-neutral-900 dark:text-neutral-100">
        <HomePageSeamlessBg />
        <SiteHeader />
        <main className="guides-learning-page">
          <BlogGuidesHero />

          <div className="guides-learning-content mx-auto w-full max-w-6xl px-4 py-12 md:px-8 md:py-16 lg:max-w-7xl">
            {featuredPost ? (
              <section className="guides-featured-section" aria-labelledby="featured-guide-heading">
                <h2 id="featured-guide-heading" className="guides-section__title">
                  {t("featuredGuide")}
                </h2>
                <div className="mt-8">
                  <BlogGuideCard post={featuredPost} locale={locale} variant="featured" />
                </div>
              </section>
            ) : null}

            {gridPosts.length > 0 ? (
              <section
                className={featuredPost ? "guides-grid-section mt-16 md:mt-20" : "guides-grid-section"}
                aria-labelledby="all-guides-heading"
              >
                <h2 id="all-guides-heading" className="guides-section__title">
                  {t("allGuides")}
                </h2>
                <div className="guides-grid mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map((post) => (
                    <BlogGuideCard key={post.slug} post={post} locale={locale} />
                  ))}
                </div>
              </section>
            ) : null}

            <WattQuickCrossLink className="mt-16 rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-md dark:border-neutral-800" />
          </div>
        </main>
        <SiteFooter tagline="blog" />
      </div>
    </>
  );
}
