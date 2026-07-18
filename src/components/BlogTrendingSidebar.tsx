"use client";

import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { clsx } from "clsx";
import type { BlogTopGuideItem } from "@/components/BlogMagazineFeed";
import { BlogArticleLink } from "@/components/BlogArticleLink";

type BlogSubCategoryItem = {
  id: string;
  label: string;
  count: number;
};

type BlogTrendingSidebarProps = {
  posts: BlogTopGuideItem[];
  subCategories: BlogSubCategoryItem[];
  activeSubCategory: string | "all";
  onSubCategoryChange: (subCategory: string | "all") => void;
  className?: string;
};

export function BlogTrendingSidebar({
  posts,
  subCategories,
  activeSubCategory,
  onSubCategoryChange,
  className,
}: BlogTrendingSidebarProps) {
  const t = useTranslations("Blog");
  if (!posts.length) return null;

  return (
    <aside
      className={clsx("blog-magazine-sidebar", className)}
      aria-labelledby="blog-magazine-sidebar-title"
    >
      {subCategories.length > 0 ? (
        <section className="blog-magazine-sidebar__subtopics">
          <h2 className="blog-magazine-sidebar__subtopics-title">
            {t("browseBySubtopic")}
          </h2>
          <ul className="blog-magazine-sidebar__subtopics-list">
            <li>
              <button
                type="button"
                className={clsx(
                  "blog-magazine-sidebar__subtopic",
                  activeSubCategory === "all" &&
                    "blog-magazine-sidebar__subtopic--active",
                )}
                onClick={() => onSubCategoryChange("all")}
              >
                <span>{t("allSubtopics")}</span>
                <span>{subCategories.reduce((sum, item) => sum + item.count, 0)}</span>
              </button>
            </li>
            {subCategories.map((subCategory) => (
              <li key={subCategory.id}>
                <button
                  type="button"
                  className={clsx(
                    "blog-magazine-sidebar__subtopic",
                    activeSubCategory === subCategory.id &&
                      "blog-magazine-sidebar__subtopic--active",
                  )}
                  onClick={() => onSubCategoryChange(subCategory.id)}
                >
                  <span>{subCategory.label}</span>
                  <span>{subCategory.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <header className="blog-magazine-sidebar__head">
        <p className="blog-magazine-sidebar__eyebrow">{t("mustReadEyebrow")}</p>
        <h2 id="blog-magazine-sidebar-title" className="blog-magazine-sidebar__title">
          {t.has("topGuides") ? t("topGuides", { count: posts.length }) : t("mustRead")}
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

function TrendingItem({ post, rank }: { post: BlogTopGuideItem; rank: number }) {
  return (
    <BlogArticleLink slug={post.slug} title={post.title} className="blog-magazine-sidebar-item group">
      <span className="blog-magazine-sidebar-item__rank" aria-hidden>
        {String(rank).padStart(2, "0")}
      </span>
      <span className="blog-magazine-sidebar-item__content">
        <span className="blog-magazine-sidebar-item__title">{post.title}</span>
        {post.readTime ? (
          <span className="blog-magazine-sidebar-item__meta">
            <Clock className="blog-magazine-sidebar-item__meta-icon" aria-hidden />
            {post.readTime}
          </span>
        ) : null}
      </span>
    </BlogArticleLink>
  );
}
