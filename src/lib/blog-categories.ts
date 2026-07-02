import { registry } from "@/lib/registry";
import type { BlogPost } from "@/lib/types";

/** Blog card category — aligned with JoinMyPDF tool groups. */
export type BlogDisplayCategory = "conversion" | "editing" | "security" | "advanced";

export const BLOG_CATEGORY_ORDER: BlogDisplayCategory[] = [
  "conversion",
  "editing",
  "security",
  "advanced",
];

const TOOL_CATEGORY_TO_BLOG: Record<string, BlogDisplayCategory> = {
  convert: "conversion",
  edit: "editing",
  security: "security",
  optimize: "advanced",
};

export const BLOG_CATEGORY_ACCENT: Record<BlogDisplayCategory, string> = {
  conversion: "#3B82F6",
  editing: "#F97316",
  security: "#10B981",
  advanced: "#8B5CF6",
};

export const BLOG_CATEGORY_BADGE_CLASS: Record<BlogDisplayCategory, string> = {
  conversion:
    "guide-category-badge guide-category-badge--conversion inline-flex w-fit rounded-full border border-blue-500/25 bg-blue-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-300 backdrop-blur-sm",
  editing:
    "guide-category-badge guide-category-badge--editing inline-flex w-fit rounded-full border border-orange-500/25 bg-orange-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-300 backdrop-blur-sm",
  security:
    "guide-category-badge guide-category-badge--security inline-flex w-fit rounded-full border border-emerald-500/25 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300 backdrop-blur-sm",
  advanced:
    "guide-category-badge guide-category-badge--advanced inline-flex w-fit rounded-full border border-purple-500/25 bg-purple-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-purple-300 backdrop-blur-sm",
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

export function getBlogCategoryAccent(category: BlogDisplayCategory): string {
  return BLOG_CATEGORY_ACCENT[category];
}

export function getBlogCategoryBadgeClass(category: BlogDisplayCategory): string {
  return BLOG_CATEGORY_BADGE_CLASS[category];
}
