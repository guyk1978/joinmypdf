import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { BlogArticleContent } from "@/components/BlogArticleContent";
import {
  generateBlogArticleMetadata,
  generateBlogArticleStaticParams,
  resolveBlogArticlePost,
} from "@/lib/blog-article";
import { productPageMainClassName } from "@/lib/tool-ui";
import type { Metadata } from "next";

export const dynamicParams = false;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return generateBlogArticleStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  return generateBlogArticleMetadata({ locale, slug });
}

/** Canonical article page. Legacy `/article/[slug]` URLs redirect here at the edge. */
export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = resolveBlogArticlePost(locale, slug);
  if (!post) notFound();

  return (
    <AppPageShell mainClassName={productPageMainClassName}>
      <BlogArticleContent post={post} locale={locale} />
    </AppPageShell>
  );
}
