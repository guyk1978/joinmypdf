"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BlogMagazineCardClient } from "@/components/BlogMagazineCardClient";
import { BlogTopicFilters } from "@/components/BlogTopicFilters";
import type { BlogDisplayCategory } from "@/lib/blog-categories";

export type BlogMagazineFeedItem = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogDisplayCategory;
  categoryLabel: string;
  readTime: string;
  coverImage: string | null;
};

type BlogMagazineFeedProps = {
  items: BlogMagazineFeedItem[];
  categories: BlogDisplayCategory[];
  initialVisible?: number;
  batchSize?: number;
};

const INITIAL_VISIBLE = 9;
const BATCH_SIZE = 6;

export function BlogMagazineFeed({
  items,
  categories,
  initialVisible = INITIAL_VISIBLE,
  batchSize = BATCH_SIZE,
}: BlogMagazineFeedProps) {
  const t = useTranslations("Blog");
  const [activeCategory, setActiveCategory] = useState<BlogDisplayCategory | "all">("all");
  const [visibleCount, setVisibleCount] = useState(initialVisible);

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredItems.length - visibleCount);

  const handleCategoryChange = (category: BlogDisplayCategory | "all") => {
    setActiveCategory(category);
    setVisibleCount(initialVisible);
  };

  return (
    <div className="blog-magazine-feed">
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
      </header>

      {visibleItems.length > 0 ? (
        <ul className="blog-magazine-feed__grid">
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
  );
}
