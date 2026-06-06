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
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-4 md:py-14">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-black dark:text-neutral-200 dark:text-black dark:text-neutral-200">
            {t("badge")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-black dark:text-neutral-200 dark:text-slate-100 md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-neutral-800 dark:text-neutral-400 dark:text-slate-400">
            {t("description")}
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
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
