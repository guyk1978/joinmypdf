import { registry } from "@/lib/registry";
import type { BlogPost } from "@/lib/types";

/** Blog card category — aligned with JoinMyPDF tool groups. */
export type BlogDisplayCategory = "conversion" | "editing" | "security" | "advanced";

const TOOL_CATEGORY_TO_BLOG: Record<string, BlogDisplayCategory> = {
  convert: "conversion",
  edit: "editing",
  security: "security",
  optimize: "advanced",
};

export const BLOG_CATEGORY_BADGE_CLASS: Record<BlogDisplayCategory, string> = {
  conversion: "inline-flex w-fit rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-blue-400",
  editing: "inline-flex w-fit rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-orange-400",
  security: "inline-flex w-fit rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-emerald-400",
  advanced: "inline-flex w-fit rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-purple-400",
};

function postHint(post: BlogPost): string {
  return `${post.category || ""} ${post.slug} ${post.title} ${post.keyword || ""}`.toLowerCase();
}

function categoryFromRelatedTools(post: BlogPost): BlogDisplayCategory | null {
  const slugs = post.relatedTools || [];
  if (!slugs.length) return null;

  const counts: Record<BlogDisplayCategory, number> = {
    conversion: 0,
    editing: 0,
    security: 0,
    advanced: 0,
  };

  for (const slug of slugs) {
    const tool = registry.tools.find((item) => item.slug === slug);
    if (!tool) continue;
    const mapped = TOOL_CATEGORY_TO_BLOG[tool.category] ?? "advanced";
    counts[mapped] += 1;
  }

  const best = (Object.entries(counts) as [BlogDisplayCategory, number][]).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : null;
}

function categoryFromKeywords(key: string): BlogDisplayCategory | null {
  if (/privacy|security|protect|password|unlock|safe|redact|metadata|encrypt/.test(key)) {
    return "security";
  }
  if (/compress|optim|repair|flatten|compare|booklet|advanced/.test(key)) {
    return "advanced";
  }
  if (/merge|split|convert|jpg|jpeg|png|word|excel|heic|html|ebook|to-pdf|pdf-to/.test(key)) {
    return "conversion";
  }
  if (/edit|sign|watermark|rotate|crop|annotate|delete|extract|reorder|rename|page/.test(key)) {
    return "editing";
  }
  return null;
}

/** Resolve display category from related tools, keywords, then editorial category. */
export function resolveBlogDisplayCategory(post: BlogPost): BlogDisplayCategory {
  const fromTools = categoryFromRelatedTools(post);
  if (fromTools) return fromTools;

  const key = postHint(post);
  const fromKeywords = categoryFromKeywords(key);
  if (fromKeywords) return fromKeywords;

  const editorial = post.category?.toLowerCase() || "";
  if (editorial.includes("privacy") || editorial.includes("security")) return "security";
  if (editorial.includes("convert")) return "conversion";
  if (editorial.includes("edit")) return "editing";

  return "advanced";
}

export function getBlogCategoryBadgeClass(category: BlogDisplayCategory): string {
  return BLOG_CATEGORY_BADGE_CLASS[category];
}
