import type { BlogPost } from "@/lib/types";

export type BlogCardAccent = {
  id: "red" | "blue" | "emerald" | "amber";
  badgeClassName: string;
  borderTopClassName: string;
  titleHoverClassName: string;
};

export const BLOG_CARD_ACCENTS: readonly BlogCardAccent[] = [
  {
    id: "red",
    badgeClassName:
      "inline-flex w-fit bg-red-600 px-3 py-1 text-xs font-bold tracking-wide text-white shadow-sm rounded-md",
    borderTopClassName: "border-t-red-600",
    titleHoverClassName: "group-hover:text-red-600 dark:group-hover:text-red-400",
  },
  {
    id: "blue",
    badgeClassName:
      "inline-flex w-fit bg-blue-600 px-3 py-1 text-xs font-bold tracking-wide text-white shadow-sm rounded-md",
    borderTopClassName: "border-t-blue-600",
    titleHoverClassName: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
  },
  {
    id: "emerald",
    badgeClassName:
      "inline-flex w-fit bg-emerald-600 px-3 py-1 text-xs font-bold tracking-wide text-white shadow-sm rounded-md",
    borderTopClassName: "border-t-emerald-600",
    titleHoverClassName: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  },
  {
    id: "amber",
    badgeClassName:
      "inline-flex w-fit bg-amber-500 px-3 py-1 text-xs font-bold tracking-wide text-slate-950 shadow-sm rounded-md",
    borderTopClassName: "border-t-amber-500",
    titleHoverClassName: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
  },
] as const;

/** Strong primary accent — cycles red → blue → green → amber. */
export function getBlogCardAccent(index: number): BlogCardAccent {
  return BLOG_CARD_ACCENTS[((index % 4) + 4) % 4]!;
}

/** Optional type hint shifts accent while keeping bold primaries. */
export function getBlogCardAccentForPost(post: BlogPost, index: number): BlogCardAccent {
  const key = `${post.category || ""} ${post.slug} ${post.title}`.toLowerCase();
  if (key.includes("how-to") || key.includes("how to") || key.startsWith("how-")) {
    return BLOG_CARD_ACCENTS[1]!;
  }
  if (key.includes("privacy") || key.includes("security") || key.includes("safe")) {
    return BLOG_CARD_ACCENTS[2]!;
  }
  if (key.includes("compare") || key.includes("vs")) {
    return BLOG_CARD_ACCENTS[0]!;
  }
  if (key.includes("mobile") || key.includes("tip")) {
    return BLOG_CARD_ACCENTS[3]!;
  }
  return getBlogCardAccent(index);
}

export function getBlogBadgeLabel(post: BlogPost): string {
  const category = post.category?.trim() || "";
  const key = `${category} ${post.slug} ${post.title}`.toLowerCase();

  if (key.includes("how-to") || key.includes("how to") || key.startsWith("how-")) return "How-To";
  if (key.includes("privacy") || key.includes("security") || key.includes("safe")) return category || "Privacy";
  if (key.includes("mobile")) return "Mobile";
  if (key.includes("tip")) return "Tips";
  if (key.includes("compare") || key.includes("vs")) return "Comparison";

  return category || "PDF Guide";
}

export function getBlogExcerpt(post: BlogPost): string {
  return post.description || post.seo?.metaDescription || "";
}

export function estimateBlogReadTime(post: BlogPost): string {
  if (post.readTime?.trim()) {
    const value = post.readTime.trim();
    return value.toLowerCase().includes("min") ? value : `${value} min read`;
  }

  const words = post.contentBlocks?.wordCount;
  if (words && words > 0) {
    const mins = Math.max(1, Math.round(words / 200));
    return `${mins} min read`;
  }

  const text = getBlogExcerpt(post) || post.title;
  const approxWords = text.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(3, Math.min(12, Math.round(approxWords / 40) + 2));
  return `${mins} min read`;
}
