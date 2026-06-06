import type { BlogPost } from "@/lib/types";

type BlogTranslator = {
  (key: "badges.howTo"): string;
  (key: "badges.privacy"): string;
  (key: "badges.mobile"): string;
  (key: "badges.tips"): string;
  (key: "badges.comparison"): string;
  (key: "badges.defaultGuide"): string;
  (key: "readTimeMinutes", values: { mins: number }): string;
};

function postHintKey(post: BlogPost): string {
  const category = post.category?.trim() || "";
  return `${category} ${post.slug} ${post.title}`.toLowerCase();
}

/** Localized badge label for blog cards and article headers. */
export function getLocalizedBlogBadgeLabel(post: BlogPost, t: BlogTranslator): string {
  const category = post.category?.trim() || "";
  const key = postHintKey(post);

  if (key.includes("how-to") || key.includes("how to") || key.startsWith("how-")) {
    return t("badges.howTo");
  }
  if (key.includes("privacy") || key.includes("security") || key.includes("safe")) {
    return category || t("badges.privacy");
  }
  if (key.includes("mobile")) return t("badges.mobile");
  if (key.includes("tip")) return t("badges.tips");
  if (key.includes("compare") || key.includes("vs")) return t("badges.comparison");

  return category || t("badges.defaultGuide");
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
