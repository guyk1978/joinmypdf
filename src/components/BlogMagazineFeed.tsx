"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BlogMagazineCardClient } from "@/components/BlogMagazineCardClient";
import { BlogTopicFilters } from "@/components/BlogTopicFilters";
import { BlogTrendingSidebar } from "@/components/BlogTrendingSidebar";
import type { BlogDisplayCategory } from "@/lib/blog-categories";

export type BlogMagazineFeedItem = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogDisplayCategory;
  categoryLabel: string;
  subCategory: string;
  subCategoryLabel: string;
  readTime: string;
  coverImage: string | null;
};

export type BlogTopGuideItem = {
  slug: string;
  title: string;
  readTime: string;
};

type BlogMagazineFeedProps = {
  items: BlogMagazineFeedItem[];
  categories: BlogDisplayCategory[];
  topGuides: BlogTopGuideItem[];
  initialVisible?: number;
  batchSize?: number;
};

const INITIAL_VISIBLE = 12;
const BATCH_SIZE = 12;

export function BlogMagazineFeed({
  items,
  categories,
  topGuides,
  initialVisible = INITIAL_VISIBLE,
  batchSize = BATCH_SIZE,
}: BlogMagazineFeedProps) {
  const t = useTranslations("Blog");
  const [activeCategory, setActiveCategory] = useState<BlogDisplayCategory | "all">("all");
  const [activeSubCategory, setActiveSubCategory] = useState<string | "all">("all");
  const [visibleCount, setVisibleCount] = useState(initialVisible);

  const subCategories = useMemo(() => {
    if (activeCategory === "all") return [];

    const counts = new Map<string, { id: string; label: string; count: number }>();
    for (const item of items) {
      if (item.category !== activeCategory) continue;
      const current = counts.get(item.subCategory);
      counts.set(item.subCategory, {
        id: item.subCategory,
        label: item.subCategoryLabel,
        count: (current?.count ?? 0) + 1,
      });
    }

    return [...counts.values()].sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label),
    );
  }, [activeCategory, items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) return false;
      if (activeSubCategory !== "all" && item.subCategory !== activeSubCategory) return false;
      return true;
    });
  }, [activeCategory, activeSubCategory, items]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredItems.length - visibleCount);

  const handleCategoryChange = (category: BlogDisplayCategory | "all") => {
    setActiveCategory(category);
    setActiveSubCategory("all");
    setVisibleCount(initialVisible);
  };

  const handleSubCategoryChange = (subCategory: string | "all") => {
    setActiveSubCategory(subCategory);
    setVisibleCount(initialVisible);
  };

  return (
    <div className="blog-magazine-index__layout">
      <div className="blog-magazine-index__main blog-magazine-feed">
        <header className="blog-magazine-feed__head">
          <div>
            <p className="blog-magazine-feed__eyebrow">{t("curatedTopicsEyebrow")}</p>
            <h2 className="blog-magazine-feed__title">{t("curatedTopics")}</h2>
          </div>
          <BlogTopicFilters
            categories={categories}
            activeCategory={activeCategory}
            onChange={handleCategoryChange}
          />

          {subCategories.length > 0 ? (
            <nav
              className="blog-subtopic-filters"
              aria-label={t("subtopicFiltersLabel")}
            >
              <p className="blog-subtopic-filters__label">{t("browseBySubtopic")}</p>
              <div className="blog-subtopic-filters__scroller">
                <button
                  type="button"
                  className={
                    activeSubCategory === "all"
                      ? "blog-subtopic-chip blog-subtopic-chip--active"
                      : "blog-subtopic-chip"
                  }
                  onClick={() => handleSubCategoryChange("all")}
                >
                  {t("allSubtopics")}
                </button>
                {subCategories.map((subCategory) => (
                  <button
                    key={subCategory.id}
                    type="button"
                    className={
                      activeSubCategory === subCategory.id
                        ? "blog-subtopic-chip blog-subtopic-chip--active"
                        : "blog-subtopic-chip"
                    }
                    onClick={() => handleSubCategoryChange(subCategory.id)}
                  >
                    {subCategory.label}
                    <span className="blog-subtopic-chip__count">{subCategory.count}</span>
                  </button>
                ))}
              </div>
            </nav>
          ) : null}
        </header>

        {visibleItems.length > 0 ? (
          <ul className="blog-magazine-feed__list">
            {visibleItems.map((item) => (
              <li key={item.slug}>
                <BlogMagazineCardClient item={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="blog-magazine-feed__empty">{t("noArticlesInCategory")}</p>
        )}

        {remainingCount > 0 ? (
          <div className="blog-magazine-feed__more">
            <button
              type="button"
              className="blog-magazine-feed__load-more"
              onClick={() => setVisibleCount((count) => count + batchSize)}
            >
              {t("loadMoreArticles", { count: remainingCount })}
            </button>
          </div>
        ) : null}
      </div>

      <BlogTrendingSidebar
        posts={topGuides}
        subCategories={subCategories}
        activeSubCategory={activeSubCategory}
        onSubCategoryChange={handleSubCategoryChange}
        className="blog-magazine-index__aside"
      />
    </div>
  );
}
