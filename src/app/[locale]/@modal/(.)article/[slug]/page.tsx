import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InterceptedArticleModalClient } from "@/components/InterceptedArticleModalClient";
import { BlogArticleContent } from "@/components/BlogArticleContent";
import {
  generateBlogArticleMetadata,
  generateBlogArticleStaticParams,
  resolveBlogArticlePost,
} from "@/lib/blog-article";
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

/**
 * App Router intercepting route for soft navigations to `/article/[slug]`.
 * Folder: `@modal/(.)article/[slug]` under `[locale]` (sibling of `/article`).
 */
export default async function InterceptedArticleModalPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = resolveBlogArticlePost(locale, slug);
  if (!post) notFound();

  const t = await getTranslations("Blog");
  const title = post.seo?.metaTitle || post.title;

  return (
    <InterceptedArticleModalClient title={title} closeLabel={t("articleModalClose")}>
      <BlogArticleContent post={post} locale={locale} />
    </InterceptedArticleModalClient>
  );
}
