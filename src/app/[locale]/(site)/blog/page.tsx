import { BlogMagazineIndex } from "@/components/BlogMagazineIndex";
import { AppPageShell } from "@/components/AppPageShell";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { getBlogRegistry } from "@/lib/blog-registry";
import type { Metadata } from "next";
import { buildPageSocialMetadata } from "@/lib/og-images";
import { getTranslations, setRequestLocale } from "next-intl/server";


type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });

  const title = t("metaTitle");
  const description = t("metaDescription");
  const canonicalPath = `/${locale}/blog`;
  return {
    title,
    description,
    robots: { index: true, follow: true },
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
    },
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

  return (
    <AppPageShell>
      <div className="page-container app-hub-content-rail">
        <ProductPageLayout title={t("title")} description={t("description")} variant="magazine">
          {posts.length > 0 ? (
            <BlogMagazineIndex posts={posts} />
          ) : null}
        </ProductPageLayout>
      </div>
    </AppPageShell>
  );
}
