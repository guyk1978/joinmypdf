import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Clock } from "lucide-react";
import { clsx } from "clsx";
import {
  getLocalizedBlogCategoryLabel,
  getLocalizedBlogReadTime,
} from "@/lib/blog-card-i18n";
import { resolveBlogDisplayCategory } from "@/lib/blog-categories";
import type { BlogPost } from "@/lib/types";

type BlogTrendingSidebarProps = {
  posts: BlogPost[];
  className?: string;
};

export async function BlogTrendingSidebar({ posts, className }: BlogTrendingSidebarProps) {
  if (!posts.length) return null;

  const t = await getTranslations("Blog");

  return (
    <aside
      className={clsx("blog-magazine-sidebar", className)}
      aria-labelledby="blog-magazine-sidebar-title"
    >
      <header className="blog-magazine-sidebar__head">
        <p className="blog-magazine-sidebar__eyebrow">{t("mustReadEyebrow")}</p>
        <h2 id="blog-magazine-sidebar-title" className="blog-magazine-sidebar__title">
          {t("mustRead")}
        </h2>
      </header>

      <ol className="blog-magazine-sidebar__list">
        {posts.map((post, index) => (
          <li key={post.slug}>
            <TrendingItem post={post} rank={index + 1} />
          </li>
        ))}
      </ol>
    </aside>
  );
}

async function TrendingItem({ post, rank }: { post: BlogPost; rank: number }) {
  const t = await getTranslations("Blog");
  const category = resolveBlogDisplayCategory(post);
  const categoryLabel = getLocalizedBlogCategoryLabel(post, t);
  const readTime = getLocalizedBlogReadTime(post, t);

  return (
    <Link href={`/blog/${post.slug}/`} className="blog-magazine-sidebar-item group" prefetch={false}>
      <span className="blog-magazine-sidebar-item__rank" aria-hidden>
        {String(rank).padStart(2, "0")}
      </span>
      <span className="blog-magazine-sidebar-item__content">
        <span className={clsx("blog-category-badge", `blog-category-badge--${category}`)}>
          {categoryLabel}
        </span>
        <span className="blog-magazine-sidebar-item__title">{post.title}</span>
        {readTime ? (
          <span className="blog-magazine-sidebar-item__meta">
            <Clock className="blog-magazine-sidebar-item__meta-icon" aria-hidden />
            {readTime}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
