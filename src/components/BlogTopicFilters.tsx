"use client";

import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import type { BlogDisplayCategory } from "@/lib/blog-categories";

const CATEGORY_LABEL_KEYS = {
  conversion: "categories.conversion",
  editing: "categories.editing",
  security: "categories.security",
  advanced: "categories.advanced",
} as const;

type BlogTopicFiltersProps = {
  categories: BlogDisplayCategory[];
  activeCategory: BlogDisplayCategory | "all";
  onChange: (category: BlogDisplayCategory | "all") => void;
};

export function BlogTopicFilters({ categories, activeCategory, onChange }: BlogTopicFiltersProps) {
  const t = useTranslations("Blog");

  return (
    <nav className="blog-topic-filters" aria-label={t("topicFiltersLabel")}>
      <div className="blog-topic-filters__inner">
        <button
          type="button"
          className={clsx(
            "blog-topic-filters__pill",
            activeCategory === "all" && "blog-topic-filters__pill--active",
          )}
          onClick={() => onChange("all")}
        >
          {t("allTopics")}
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={clsx(
              "blog-topic-filters__pill",
              activeCategory === category && "blog-topic-filters__pill--active",
            )}
            onClick={() => onChange(category)}
          >
            {t(CATEGORY_LABEL_KEYS[category])}
          </button>
        ))}
      </div>
    </nav>
  );
}
