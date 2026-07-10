import type { BlogPost } from "@/lib/types";
import { MP3_TOOL_IDS, type Mp3ToolId } from "@/lib/mp3-tools";

function normalizeCategory(post: BlogPost): string {
  return (post.category || "").trim().toLowerCase();
}

function postHint(post: BlogPost): string {
  return `${post.slug} ${post.title} ${post.keyword || ""} ${post.description || ""}`.toLowerCase();
}

/** True when editorial category targets audio / MP3 guides. */
export function isAudioOrMp3BlogPost(post: BlogPost): boolean {
  const category = normalizeCategory(post);
  if (category === "audio" || category === "mp3" || category.includes("audio") || category.includes("mp3")) {
    return true;
  }

  const relatedTools = post.relatedTools || [];
  if (relatedTools.some((slug) => MP3_TOOL_IDS.includes(slug as Mp3ToolId))) {
    return true;
  }

  const hint = postHint(post);
  return /\bmp3\b/.test(hint) || /\baudio\b/.test(hint);
}

export function getRecentAudioMp3BlogPosts(posts: BlogPost[], limit = 3): BlogPost[] {
  return [...posts]
    .filter(isAudioOrMp3BlogPost)
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit);
}

function legacyParagraphs(post: BlogPost): string[] {
  const body = post.contentBlocks?.body;
  if (!body) return [];
  if (Array.isArray(body)) return body.map(String);
  return String(body)
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function collectEarlyParagraphs(post: BlogPost, limit = 3): string[] {
  const sections = post.contentBlocks?.sections;
  const paragraphs: string[] = [];

  if (sections?.length) {
    for (const section of sections) {
      for (const paragraph of section.paragraphs || []) {
        paragraphs.push(paragraph);
        if (paragraphs.length >= limit) return paragraphs;
      }
    }
    return paragraphs;
  }

  for (const paragraph of legacyParagraphs(post)) {
    paragraphs.push(paragraph);
    if (paragraphs.length >= limit) return paragraphs;
  }

  return paragraphs;
}

/** 1-based paragraph index after which to show the MP3 tools CTA, or null when not applicable. */
export function getMp3ToolsCtaInsertAfterParagraph(post: BlogPost): number | null {
  if (!isAudioOrMp3BlogPost(post)) return null;

  const earlyCount = collectEarlyParagraphs(post, 3).length;
  if (earlyCount === 0) return null;

  return 1;
}
