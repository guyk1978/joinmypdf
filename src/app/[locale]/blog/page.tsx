import { BlogCategorizedIndex } from "@/components/BlogCategorizedIndex";
import { AppPageShell } from "@/components/AppPageShell";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { getBlogRegistry } from "@/lib/blog-registry";
import { productPageMainClassName } from "@/lib/tool-ui";
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

  return (
    <AppPageShell mainClassName={productPageMainClassName}>
      <ProductPageLayout title={t("title")} description={t("description")}>
        {posts.length > 0 ? (
          <BlogCategorizedIndex posts={posts} />
        ) : null}
      </ProductPageLayout>
    </AppPageShell>
  );
}
