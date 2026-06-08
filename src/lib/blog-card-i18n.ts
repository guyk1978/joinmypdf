import type { BlogPost } from "@/lib/types";
import {
  resolveBlogDisplayCategory,
  type BlogDisplayCategory,
} from "@/lib/blog-categories";

type BlogTranslator = {
  (key: string, values?: { mins: number }): string;
};

const CATEGORY_LABEL_KEYS: Record<BlogDisplayCategory, "categories.conversion" | "categories.editing" | "categories.security" | "categories.advanced"> = {
  conversion: "categories.conversion",
  editing: "categories.editing",
  security: "categories.security",
  advanced: "categories.advanced",
};

/** Localized category pill for blog cards and article headers. */
export function getLocalizedBlogCategoryLabel(post: BlogPost, t: BlogTranslator): string {
  const category = resolveBlogDisplayCategory(post);
  return t(CATEGORY_LABEL_KEYS[category]);
}

/** @deprecated Use getLocalizedBlogCategoryLabel */
export function getLocalizedBlogBadgeLabel(post: BlogPost, t: BlogTranslator): string {
  return getLocalizedBlogCategoryLabel(post, t);
}

/** Localized read-time string for blog cards. */
export function getLocalizedBlogReadTime(post: BlogPost, t: BlogTranslator): string {
  if (post.readTime?.trim()) {
    const value = post.readTime.trim();
    if (/\d/.test(value) && !value.toLowerCase().includes("min") && !value.includes("דק")) {
      const mins = parseInt(value, 10);
      if (!Number.isNaN(mins)) return t("readTimeMinutes", { mins });
    }
    return value;
  }

  const words = post.contentBlocks?.wordCount;
  if (words && words > 0) {
    const mins = Math.max(1, Math.round(words / 200));
    return t("readTimeMinutes", { mins });
  }

  const text = post.description || post.seo?.metaDescription || post.title;
  const approxWords = text.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(3, Math.min(12, Math.round(approxWords / 40) + 2));
  return t("readTimeMinutes", { mins });
}
