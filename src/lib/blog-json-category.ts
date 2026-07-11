import type { BlogPost } from "@/lib/types";
import { JSON_TOOL_IDS, type JsonToolId } from "@/lib/json-tools";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets Developer / JSON guides. */
export function isDeveloperOrJsonBlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (
    category === "developer" ||
    category === "json" ||
    category.includes("developer") ||
    category.includes("json")
  ) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  if (relatedTools.some((slug) => JSON_TOOL_IDS.includes(slug as JsonToolId))) {
    return true;
  }

  if (
    relatedTools.some(
      (slug) =>
        slug.includes("json") ||
        slug.includes("yaml") ||
        slug === "csv-to-json" ||
        slug === "json-to-csv",
    )
  ) {
    return true;
  }

  const hint = postHint(post);
  if (/\b(pdf|video|mp4|audio|mp3|favicon)\b/.test(hint) && !/\bjson\b/.test(hint)) {
    return false;
  }

  return /\bjson\b/.test(hint) || /\b(yaml|api.?payload|rest.?api)\b/.test(hint);
}

export function getRecentDeveloperJsonBlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isDeveloperOrJsonBlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}
