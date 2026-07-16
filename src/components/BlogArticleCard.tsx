import { Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import { BlogCardVisual } from "@/components/BlogCardVisual";
import {
  getLocalizedBlogCategoryLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import { resolveBlogDisplayCategory } from "@/lib/blog-categories";
import { resolveBlogCardCoverImage } from "@/lib/blog-cover-image";
import { getGuideExcerpt } from "@/lib/blog-excerpt";
import type { BlogPost } from "@/lib/types";

type BlogArticleCardProps = {
  post: BlogPost;
  compact?: boolean;
};

export async function BlogArticleCard({ post, compact = false }: BlogArticleCardProps) {
  const t = await getTranslations("Blog");
  const category = resolveBlogDisplayCategory(post);
  const categoryLabel = getLocalizedBlogCategoryLabel(post, t);
  const readTime = getLocalizedBlogReadTime(post, t);
  const excerpt = getGuideExcerpt(post);
  const coverImage = resolveBlogCardCoverImage(post);
  const generated = !coverImage;

  return (
    <Link
      href={`/blog/${post.slug}/`}
      className={clsx(
        "blog-magazine-card group",
        compact && "blog-magazine-card--compact",
        generated && "blog-magazine-card--generated",
      )}
      prefetch={false}
    >
      <BlogCardVisual
        slug={post.slug}
        category={category}
        coverImage={coverImage}
      />

      <div className="blog-magazine-card__body">
        {categoryLabel ? <p className="blog-magazine-card__label">{categoryLabel}</p> : null}
        <h3 className="blog-magazine-card__title">{post.title}</h3>
        {excerpt ? <p className="blog-magazine-card__excerpt">{excerpt}</p> : null}
        {readTime ? (
          <p className="blog-magazine-card__meta">
            <Clock className="blog-magazine-card__meta-icon" aria-hidden />
            {readTime}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
