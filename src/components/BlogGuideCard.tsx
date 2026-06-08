import { Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getBlogCategoryBadgeClass,
  resolveBlogDisplayCategory,
} from "@/lib/blog-categories";
import {
  getLocalizedBlogCategoryLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import type { BlogPost } from "@/lib/types";

export async function BlogGuideCard({ post }: { post: BlogPost; index?: number }) {
  const t = await getTranslations("Blog");
  const category = resolveBlogDisplayCategory(post);
  const label = getLocalizedBlogCategoryLabel(post, t);
  const readTime = getLocalizedBlogReadTime(post, t);
  const badgeClass = getBlogCategoryBadgeClass(category);

  return (
    <Link
      href={`/blog/${post.slug}/`}
      className="group flex h-full flex-col rounded-xl bg-transparent p-4 transition-colors hover:bg-neutral-100/80 dark:hover:bg-neutral-900/50"
      prefetch={false}
    >
      <span className={badgeClass}>{label}</span>
      <h2 className="mt-3 line-clamp-3 text-base font-bold leading-snug tracking-tight text-ink transition-colors group-hover:text-ink dark:text-neutral-100 dark:group-hover:text-white md:text-lg">
        {post.title}
      </h2>
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-500">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {readTime}
      </p>
    </Link>
  );
}
