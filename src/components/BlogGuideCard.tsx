import { Clock } from "lucide-react";
import Link from "next/link";
import {
  estimateBlogReadTime,
  getBlogBadgeLabel,
  getBlogCardAccentForPost,
  getBlogExcerpt,
} from "@/lib/blog-card-utils";
import type { BlogPost } from "@/lib/types";

export function BlogGuideCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  const accent = getBlogCardAccentForPost(post, index);
  const label = getBlogBadgeLabel(post);
  const description = getBlogExcerpt(post);
  const readTime = estimateBlogReadTime(post);

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
          Read article →
        </span>
      </div>
    </Link>
  );
}
