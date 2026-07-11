import type { BlogPost } from "@/lib/types";
import { TEXT_TOOL_IDS, type TextToolId } from "@/lib/text-tools";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets Text / Productivity guides. */
export function isTextOrProductivityBlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (
    category === "text" ||
    category === "productivity" ||
    category.includes("text") ||
    category.includes("productivity")
  ) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  if (relatedTools.some((slug) => TEXT_TOOL_IDS.includes(slug as TextToolId))) {
    return true;
  }

  if (
    relatedTools.some(
      (slug) =>
        slug.includes("text") ||
        slug.includes("case-converter") ||
        slug.includes("word-character") ||
        slug.includes("reading-time") ||
        slug.includes("string-generator") ||
        slug.includes("base64") ||
        slug.includes("url-encoder"),
    )
  ) {
    return true;
  }

  const hint = postHint(post);
  if (/\b(pdf|video|mp4|audio|mp3|favicon|json)\b/.test(hint) && !/\b(text|case.?convert|word.?count)\b/.test(hint)) {
    return false;
  }

  return (
    /\b(case.?convert|word.?count|character.?count|text.?diff|reading.?time|string.?generat)\b/.test(
      hint,
    ) || /\b(base64|url.?encod|markdown.?convert)\b/.test(hint)
  );
}

export function getRecentTextProductivityBlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isTextOrProductivityBlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}
