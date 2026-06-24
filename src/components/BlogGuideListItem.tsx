import { ArrowLeftRight, Clock, PenLine, Shield, Sparkles, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getLocalizedBlogCategoryLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import {
  getBlogCategoryAccent,
  resolveBlogDisplayCategory,
  type BlogDisplayCategory,
} from "@/lib/blog-categories";
import type { BlogPost } from "@/lib/types";

type BlogGuideListItemProps = {
  post: BlogPost;
};

const CATEGORY_ICON: Record<BlogDisplayCategory, LucideIcon> = {
  conversion: ArrowLeftRight,
  editing: PenLine,
  security: Shield,
  advanced: Sparkles,
};

function getGuideExcerpt(post: BlogPost): string {
  return (
    post.description?.trim() ||
    post.contentBlocks?.intro?.trim() ||
    post.seo?.metaDescription?.trim() ||
    ""
  );
}

export async function BlogGuideListItem({ post }: BlogGuideListItemProps) {
  const t = await getTranslations("Blog");
  const category = resolveBlogDisplayCategory(post);
  const categoryLabel = getLocalizedBlogCategoryLabel(post, t);
  const readTime = getLocalizedBlogReadTime(post, t);
  const excerpt = getGuideExcerpt(post);
  const accent = getBlogCategoryAccent(category);
  const Icon = CATEGORY_ICON[category];

  return (
    <Link
      href={`/blog/${post.slug}/`}
      className="guide-list-item group"
      prefetch={false}
    >
      <span
        className="guide-list-item__mark shrink-0"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5 text-white" strokeWidth={2.25} />
      </span>

      <span className="guide-list-item__content min-w-0 flex-1">
        <span className="guide-list-item__title">{post.title}</span>

        {excerpt ? (
          <span className="guide-list-item__excerpt">{excerpt}</span>
        ) : null}

        <span className="guide-list-item__meta">
          <span className="guide-list-item__category" style={{ color: accent }}>
            {categoryLabel}
          </span>
          {readTime ? (
            <>
              <span className="guide-list-item__meta-sep" aria-hidden="true">
                ·
              </span>
              <span className="guide-list-item__read-time inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {readTime}
              </span>
            </>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
