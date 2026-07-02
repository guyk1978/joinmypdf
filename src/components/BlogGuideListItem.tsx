import { Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import {
  getLocalizedBlogCategoryLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import { resolveBlogDisplayCategory } from "@/lib/blog-categories";
import type { BlogPost } from "@/lib/types";

type BlogGuideListItemProps = {
  post: BlogPost;
  showCategoryBadge?: boolean;
};

function getGuideExcerpt(post: BlogPost): string {
  return (
    post.description?.trim() ||
    post.contentBlocks?.intro?.trim() ||
    post.seo?.metaDescription?.trim() ||
    ""
  );
}

export async function BlogGuideListItem({ post, showCategoryBadge = true }: BlogGuideListItemProps) {
  const t = await getTranslations("Blog");
  const category = resolveBlogDisplayCategory(post);
  const categoryLabel = getLocalizedBlogCategoryLabel(post, t);
  const readTime = getLocalizedBlogReadTime(post, t);
  const excerpt = getGuideExcerpt(post);

  return (
    <Link href={`/blog/${post.slug}/`} className="blog-article-card group" prefetch={false}>
      {showCategoryBadge ? (
        <span className={clsx("blog-category-badge", `blog-category-badge--${category}`)}>
          {categoryLabel}
        </span>
      ) : null}

      <span className="blog-article-card__title">{post.title}</span>

      {excerpt ? <span className="blog-article-card__excerpt">{excerpt}</span> : null}

      {readTime ? (
        <span className="blog-article-card__meta">
          <Clock className="blog-article-card__meta-icon" aria-hidden />
          {readTime}
        </span>
      ) : null}
    </Link>
  );
}
