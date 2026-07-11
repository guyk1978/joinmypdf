import type { BlogPost } from "@/lib/types";
import { PNG_TOOL_IDS, type PngToolId } from "@/lib/png-tools";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets Image / PNG guides. */
export function isImageOrPngBlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (
    category === "image" ||
    category === "png" ||
    category.includes("image") ||
    category.includes("png")
  ) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  if (relatedTools.some((slug) => PNG_TOOL_IDS.includes(slug as PngToolId))) {
    return true;
  }

  if (
    relatedTools.some(
      (slug) =>
        slug.includes("png") ||
        slug.includes("image") ||
        slug.startsWith("resize-image") ||
        slug.startsWith("compress-image") ||
        slug.startsWith("crop-image") ||
        slug.startsWith("svg-to-"),
    )
  ) {
    return true;
  }

  const hint = postHint(post);
  if (/\bvideo\b|\bmp4\b|\baudio\b|\bmp3\b/.test(hint) && !/\bpng\b/.test(hint)) {
    return false;
  }

  return /\bpng\b/.test(hint) || /\b(webp|svg|favicon|compress.?image|resize.?image)\b/.test(hint);
}

export function getRecentImagePngBlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isImageOrPngBlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}
