import type { BlogPost } from "@/lib/types";
import { FAVICON_HUB_TOOL_IDS } from "@/lib/favicon-tools";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets Design / Favicon guides. */
export function isDesignOrFaviconBlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (
    category === "design" ||
    category === "favicon" ||
    category.includes("design") ||
    category.includes("favicon")
  ) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  const faviconIds = new Set(FAVICON_HUB_TOOL_IDS);
  if (relatedTools.some((slug) => faviconIds.has(slug))) {
    return true;
  }

  if (relatedTools.some((slug) => slug.includes("favicon") || slug.includes("ico"))) {
    return true;
  }

  const hint = postHint(post);
  return /\bfavicon\b/.test(hint) || /\b(ico|apple.?touch|site.?icon)\b/.test(hint);
}

export function getRecentDesignFaviconBlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isDesignOrFaviconBlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}
