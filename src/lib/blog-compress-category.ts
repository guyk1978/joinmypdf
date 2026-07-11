import type { BlogPost } from "@/lib/types";
import { COMPRESS_TOOL_IDS, type CompressToolId } from "@/lib/compress-tools";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets Compression / Optimization guides. */
export function isCompressionOrOptimizationBlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (
    category === "compression" ||
    category === "optimization" ||
    category.includes("compress") ||
    category.includes("optim")
  ) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  if (relatedTools.some((slug) => COMPRESS_TOOL_IDS.includes(slug as CompressToolId))) {
    return true;
  }

  if (
    relatedTools.some(
      (slug) =>
        slug.includes("compress") ||
        slug.includes("optimizer") ||
        slug === "pdf-compress" ||
        slug === "video-compressor" ||
        slug === "audio-compressor" ||
        slug === "mp3-compressor",
    )
  ) {
    return true;
  }

  const hint = postHint(post);
  if (/\b(favicon|json|yaml|jwt)\b/.test(hint) && !/\b(compress|optim)\b/.test(hint)) {
    return false;
  }

  return /\b(compress|compression|optimiz|file.?size|reduce.?size)\b/.test(hint);
}

export function getRecentCompressionBlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isCompressionOrOptimizationBlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}
