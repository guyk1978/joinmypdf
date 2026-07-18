import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
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
  // Embed surfaces are not indexed — canonical stays on the full article URL.
  const meta = await generateBlogArticleMetadata({ locale, slug });
  return {
    ...meta,
    robots: { index: false, follow: true },
  };
}

/** Chrome-free article body for the ArticleModal iframe (static-export safe). */
export default async function ArticleEmbedPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = resolveBlogArticlePost(locale, slug);
  if (!post) notFound();

  return (
    <div className="article-embed">
      <BlogArticleContent post={post} locale={locale} />
    </div>
  );
}
