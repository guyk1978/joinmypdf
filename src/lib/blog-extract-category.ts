import type { BlogPost } from "@/lib/types";
import { EXTRACT_TOOL_IDS } from "@/lib/extract-tools";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets Extraction / OCR guides. */
export function isExtractionOrOcrBlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (
    category === "extraction" ||
    category === "ocr" ||
    category.includes("extract") ||
    category.includes("ocr")
  ) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  if (relatedTools.some((slug) => EXTRACT_TOOL_IDS.includes(slug))) {
    return true;
  }

  if (
    relatedTools.some(
      (slug) =>
        slug.includes("extract") ||
        slug === "pdf-to-text" ||
        slug.includes("ocr"),
    )
  ) {
    return true;
  }

  const hint = postHint(post);
  if (/\b(favicon|mp3|mp4|json|yaml)\b/.test(hint) && !/\b(extract|ocr|table)\b/.test(hint)) {
    return false;
  }

  return /\b(extract|ocr|pdf.?to.?text|extract.?image|extract.?table)\b/.test(hint);
}

export function getRecentExtractionBlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isExtractionOrOcrBlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}
