import type { BlogPost } from "@/lib/types";
import { JPG_TOOL_IDS, type JpgToolId } from "@/lib/jpg-tools";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets Image / JPG guides. */
export function isImageOrJpgBlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (
    category === "image" ||
    category === "jpg" ||
    category === "jpeg" ||
    category.includes("image") ||
    category.includes("jpg") ||
    category.includes("jpeg")
  ) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  if (relatedTools.some((slug) => JPG_TOOL_IDS.includes(slug as JpgToolId))) {
    return true;
  }

  if (
    relatedTools.some(
      (slug) =>
        slug.includes("jpg") ||
        slug.includes("jpeg") ||
        slug.includes("image") ||
        slug.startsWith("compress-image") ||
        slug.startsWith("resize-image") ||
        slug.startsWith("crop-image") ||
        slug.startsWith("webp-to-jpg") ||
        slug.startsWith("heic-to-jpg"),
    )
  ) {
    return true;
  }

  const hint = postHint(post);
  if (/\b(video|mp4|audio|mp3|favicon|json)\b/.test(hint) && !/\b(jpg|jpeg)\b/.test(hint)) {
    return false;
  }

  return (
    /\b(jpg|jpeg)\b/.test(hint) ||
    /\b(webp.?to.?jpg|heic.?to.?jpg|compress.?image|resize.?image|image.?optim)\b/.test(hint)
  );
}

export function getRecentImageJpgBlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isImageOrJpgBlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}
