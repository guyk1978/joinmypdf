import type { BlogPost } from "@/lib/types";
import { DEVELOPER_HUB_TOOL_IDS, type DeveloperHubToolId } from "@/lib/developer-tools-hub";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets Cybersecurity / Web Development / Coding guides. */
export function isDeveloperSecurityBlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (
    category === "cybersecurity" ||
    category === "web development" ||
    category === "coding" ||
    category === "developer" ||
    category === "security" ||
    category.includes("cyber") ||
    category.includes("develop") ||
    category.includes("coding") ||
    category.includes("security")
  ) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  if (relatedTools.some((slug) => DEVELOPER_HUB_TOOL_IDS.includes(slug as DeveloperHubToolId))) {
    return true;
  }

  if (
    relatedTools.some(
      (slug) =>
        slug.includes("password") ||
        slug.includes("hash") ||
        slug.includes("uuid") ||
        slug.includes("jwt") ||
        slug.includes("base64") ||
        slug.includes("json-formatter") ||
        slug.includes("url-encoder"),
    )
  ) {
    return true;
  }

  const hint = postHint(post);
  if (/\b(pdf|favicon|mp3|mp4|video)\b/.test(hint) && !/\b(security|hash|password|jwt|uuid)\b/.test(hint)) {
    return false;
  }

  return /\b(cybersecurity|web.?develop|coding|password|hash|sha-?256|md5|uuid|jwt|base64|encrypt)\b/.test(
    hint,
  );
}

export function getRecentDeveloperSecurityBlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isDeveloperSecurityBlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}
