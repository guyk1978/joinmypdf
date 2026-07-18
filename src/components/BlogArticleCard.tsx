import { Clock } from "lucide-react";
import { BlogArticleLink } from "@/components/BlogArticleLink";
import type { BlogDisplayCategory } from "@/lib/blog-categories";

export type BlogArticleCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  subCategoryLabel?: string;
  readTime: string;
  publishDate?: string;
  category?: BlogDisplayCategory;
};

/**
 * Semantic article preview for the blog index — crawlable link, H2 title,
 * meta description snippet, and published time for freshness signals.
 */
export function BlogArticleCard({
  slug,
  title,
  excerpt,
  categoryLabel,
  subCategoryLabel,
  readTime,
  publishDate,
}: BlogArticleCardProps) {
  const isoDate = publishDate ? toIsoDate(publishDate) : undefined;

  return (
    <article
      className="blog-article-card"
      itemScope
      itemType="https://schema.org/BlogPosting"
    >
      {isoDate ? (
        <meta itemProp="datePublished" content={isoDate} />
      ) : null}
      {isoDate ? (
        <meta property="article:published_time" content={isoDate} />
      ) : null}
      <meta itemProp="headline" content={title} />
      {excerpt ? <meta itemProp="description" content={excerpt} /> : null}

      <BlogArticleLink
        slug={slug}
        title={title}
        className="blog-article-card__link group"
      >
        <h2 className="blog-article-card__title" itemProp="name">
          {title}
        </h2>
        {excerpt ? (
          <p className="blog-article-card__excerpt" itemProp="description">
            {excerpt}
          </p>
        ) : null}
        <p className="blog-article-card__meta">
          {categoryLabel ? (
            <span className="blog-article-card__category">{categoryLabel}</span>
          ) : null}
          {subCategoryLabel ? (
            <span className="blog-article-card__subtopic">{subCategoryLabel}</span>
          ) : null}
          {isoDate ? (
            <time
              className="blog-article-card__published"
              dateTime={isoDate}
              itemProp="datePublished"
            >
              {formatDisplayDate(isoDate)}
            </time>
          ) : null}
          {readTime ? (
            <span className="blog-article-card__read-time">
              <Clock className="blog-article-card__meta-icon" aria-hidden />
              {readTime}
            </span>
          ) : null}
        </p>
      </BlogArticleLink>
    </article>
  );
}

function toIsoDate(value: string): string | undefined {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed).toISOString();
}

function formatDisplayDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
