import type { BlogPost } from "@/lib/types";
import { CONVERT_TOOL_IDS, type ConvertToolId } from "@/lib/convert-tools";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets Conversion / How-to guides. */
export function isConversionOrHowToBlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (
    category === "conversion" ||
    category === "how-to" ||
    category === "howto" ||
    category.includes("convert") ||
    category.includes("how-to") ||
    category.includes("howto")
  ) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  if (relatedTools.some((slug) => CONVERT_TOOL_IDS.includes(slug as ConvertToolId))) {
    return true;
  }

  if (
    relatedTools.some(
      (slug) =>
        slug.includes("to-") ||
        slug.includes("convert") ||
        slug.endsWith("-to-pdf") ||
        slug.startsWith("pdf-to-") ||
        slug.includes("mp4-to-mp3"),
    )
  ) {
    return true;
  }

  const hint = postHint(post);
  if (/\b(favicon|jwt|password)\b/.test(hint) && !/\b(convert|how.?to)\b/.test(hint)) {
    return false;
  }

  return /\b(convert|conversion|how.?to|pdf.?to.?word|word.?to.?pdf|to.?mp3|to.?jpg|to.?png)\b/.test(
    hint,
  );
}

export function getRecentConversionBlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isConversionOrHowToBlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}
