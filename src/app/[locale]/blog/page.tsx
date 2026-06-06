import { BlogGuideCard } from "@/components/BlogGuideCard";
import { WattQuickCrossLink } from "@/components/partner/WattQuickCrossLink";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { blogRegistry } from "@/lib/blog-registry";
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

  const posts = [...(blogRegistry.blog || [])].sort(
    (a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl bg-neutral-100 px-2 py-6 dark:bg-neutral-950 md:px-3 md:py-8">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-black dark:text-neutral-200">
            {t("badge")}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-black dark:text-neutral-200 md:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-black dark:text-neutral-200">
            {t("description")}
          </p>
        </header>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
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
