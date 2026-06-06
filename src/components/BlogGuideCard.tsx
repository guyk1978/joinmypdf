import { Clock } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getBlogCardAccentForPost,
  getBlogExcerpt,
} from "@/lib/blog-card-utils";
import {
  getLocalizedBlogBadgeLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import type { BlogPost } from "@/lib/types";

export async function BlogGuideCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  const t = await getTranslations("Blog");
  const locale = await getLocale();
  const accent = getBlogCardAccentForPost(post, index);
  const label = getLocalizedBlogBadgeLabel(post, t);
  const description = getBlogExcerpt(post);
  const readTime = getLocalizedBlogReadTime(post, t);
  const arrow = locale === "he" ? "←" : "→";

  return (
    <Link
      href={`/blog/${post.slug}/`}
      className={`group flex h-full cursor-pointer flex-col justify-between rounded-none border border-neutral-300 border-t-2 bg-neutral-200 p-2 transition-colors hover:border-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600 ${accent.borderTopClassName}`}
      prefetch={false}
    >
      <div>
        <span className={accent.badgeClassName}>{label}</span>
        <h2
          className={`mb-1 mt-2 line-clamp-2 text-base font-bold text-black transition-colors dark:text-neutral-200 ${accent.titleHoverClassName}`}
        >
          {post.title}
        </h2>
        {description ? (
          <p className="mb-2 line-clamp-3 text-xs text-black dark:text-neutral-200">{description}</p>
        ) : (
          <div className="mb-2" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-neutral-300 pt-2 dark:border-neutral-800">
        <span className="inline-flex items-center gap-1 text-xs text-black dark:text-neutral-200">
          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
          {readTime}
        </span>
        <span className="text-xs font-semibold text-black group-hover:underline dark:text-neutral-200">
          {t("readArticle")} {arrow}
        </span>
      </div>
    </Link>
  );
}
