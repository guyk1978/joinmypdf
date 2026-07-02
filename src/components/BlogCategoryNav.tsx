"use client";

import { useTranslations } from "next-intl";
import type { BlogDisplayCategory } from "@/lib/blog-categories";
import { blogCategorySectionId } from "@/lib/blog-index";

type BlogCategoryNavProps = {
  categories: BlogDisplayCategory[];
};

const CATEGORY_LABEL_KEYS = {
  conversion: "categories.conversion",
  editing: "categories.editing",
  security: "categories.security",
  advanced: "categories.advanced",
} as const;

export function BlogCategoryNav({ categories }: BlogCategoryNavProps) {
  const t = useTranslations("Blog");

  const jumpTo = (category: BlogDisplayCategory) => {
    const target = document.getElementById(blogCategorySectionId(category));
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="blog-category-nav" aria-label={t("categoryNavLabel")}>
      <div className="blog-category-nav__inner">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`blog-category-nav__link blog-category-nav__link--${category}`}
            onClick={() => jumpTo(category)}
          >
            {t(CATEGORY_LABEL_KEYS[category])}
          </button>
        ))}
      </div>
    </nav>
  );
}
