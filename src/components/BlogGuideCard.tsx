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
      className={`group flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-slate-100 border-t-4 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 ${accent.borderTopClassName}`}
      prefetch={false}
    >
      <div>
        <span className={accent.badgeClassName}>{label}</span>
        <h2
          className={`mb-2 mt-3 line-clamp-2 text-xl font-bold text-slate-900 transition-colors duration-300 dark:text-slate-100 ${accent.titleHoverClassName}`}
        >
          {post.title}
        </h2>
        {description ? (
          <p className="mb-4 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        ) : (
          <div className="mb-4" />
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {readTime}
        </span>
        <span className="text-sm font-semibold text-blue-600 group-hover:underline dark:text-blue-400">
          Read article →
        </span>
      </div>
    </Link>
  );
}
