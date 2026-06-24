import { ArrowUpRight, Clock } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { clsx } from "clsx";
import {
  getBlogCategoryBadgeClass,
  resolveBlogDisplayCategory,
} from "@/lib/blog-categories";
import {
  getLocalizedBlogCategoryLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import { resolveBlogOgImagePath } from "@/lib/og-images-blog";
import type { BlogPost } from "@/lib/types";

type BlogGuideCardProps = {
  post: BlogPost;
  locale?: string;
  variant?: "default" | "featured";
};

function getGuideExcerpt(post: BlogPost): string {
  return (
    post.description?.trim() ||
    post.contentBlocks?.intro?.trim() ||
    post.seo?.metaDescription?.trim() ||
    ""
  );
}

export async function BlogGuideCard({ post, locale, variant = "default" }: BlogGuideCardProps) {
  const t = await getTranslations("Blog");
  const resolvedLocale = locale ?? (await getLocale());
  const category = resolveBlogDisplayCategory(post);
  const label = getLocalizedBlogCategoryLabel(post, t);
  const readTime = getLocalizedBlogReadTime(post, t);
  const badgeClass = getBlogCategoryBadgeClass(category);
  const excerpt = getGuideExcerpt(post);
  const imageSrc = post.coverImage || resolveBlogOgImagePath(post, resolvedLocale);
  const isFeatured = variant === "featured";

  return (
    <Link
      href={`/blog/${post.slug}/`}
      className={clsx(
        "guide-card group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-neutral-600 hover:bg-white/[0.06] hover:shadow-[0_20px_56px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] dark:border-neutral-800 dark:bg-neutral-900/50",
        isFeatured && "guide-card--featured md:flex-row md:items-stretch",
      )}
      prefetch={false}
    >
      <div
        className={clsx(
          "guide-card__visual relative overflow-hidden bg-neutral-950/60",
          isFeatured ? "min-h-[220px] md:min-h-0 md:w-[42%] md:shrink-0" : "aspect-[16/10] w-full",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading={isFeatured ? "eager" : "lazy"}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent" />
        <span className={clsx(badgeClass, "guide-card__badge absolute start-4 top-4")}>{label}</span>
      </div>

      <div
        className={clsx(
          "guide-card__body flex flex-1 flex-col",
          isFeatured ? "p-8 md:p-10 lg:p-12" : "p-6 md:p-7",
        )}
      >
        {isFeatured ? (
          <p className="guide-card__eyebrow mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
            {t("featuredGuide")}
          </p>
        ) : null}

        <h2
          className={clsx(
            "guide-card__title line-clamp-3 font-bold tracking-tight text-neutral-50 transition-colors group-hover:text-white",
            isFeatured ? "text-2xl leading-tight md:text-3xl lg:text-[2rem]" : "text-xl leading-snug md:text-[1.375rem]",
          )}
        >
          {post.title}
        </h2>

        {excerpt ? (
          <p
            className={clsx(
              "guide-card__excerpt mt-4 line-clamp-3 leading-relaxed text-neutral-400",
              isFeatured ? "text-base md:text-lg md:leading-relaxed" : "text-sm md:text-[0.9375rem]",
            )}
          >
            {excerpt}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <p className="inline-flex items-center gap-1.5 text-sm text-neutral-500">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            {readTime}
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-300 transition-colors group-hover:text-white">
            {t("readArticle")}
            <ArrowUpRight className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
