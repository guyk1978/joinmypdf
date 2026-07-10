import type { BlogPost } from "@/lib/types";
import { MP4_TOOL_IDS, type Mp4ToolId } from "@/lib/mp4-tools";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets video / MP4 guides. */
export function isVideoOrMp4BlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (category === "video" || category === "mp4" || category.includes("video") || category.includes("mp4")) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  if (relatedTools.some((slug) => MP4_TOOL_IDS.includes(slug as Mp4ToolId))) {
    return true;
  }

  if (relatedTools.some((slug) => slug.startsWith("video-"))) {
    return true;
  }

  const hint = postHint(post);
  return /\bmp4\b/.test(hint) || /\bvideo\b/.test(hint);
}

export function getRecentVideoMp4BlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isVideoOrMp4BlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}
