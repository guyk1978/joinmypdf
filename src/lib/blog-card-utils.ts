import type { BlogPost } from "@/lib/types";

export type BlogCardAccent = {
  id: "neutral-a" | "neutral-b" | "neutral-c" | "neutral-d";
  badgeClassName: string;
  borderTopClassName: string;
  titleHoverClassName: string;
};

export const BLOG_CARD_ACCENTS: readonly BlogCardAccent[] = [
  {
    id: "neutral-a",
    badgeClassName:
      "inline-flex w-fit bg-neutral-900 px-3 py-1 text-xs font-bold tracking-wide text-neutral-100 rounded-none dark:bg-neutral-200 dark:text-neutral-950",
    borderTopClassName: "border-t-neutral-900 dark:border-t-neutral-200",
    titleHoverClassName: "group-hover:text-black dark:group-hover:text-neutral-100",
  },
  {
    id: "neutral-b",
    badgeClassName:
      "inline-flex w-fit bg-neutral-800 px-3 py-1 text-xs font-bold tracking-wide text-neutral-100 rounded-none dark:bg-neutral-300 dark:text-neutral-950",
    borderTopClassName: "border-t-neutral-800 dark:border-t-neutral-300",
    titleHoverClassName: "group-hover:text-black dark:group-hover:text-neutral-100",
  },
  {
    id: "neutral-c",
    badgeClassName:
      "inline-flex w-fit bg-neutral-700 px-3 py-1 text-xs font-bold tracking-wide text-neutral-100 rounded-none dark:bg-neutral-400 dark:text-neutral-950",
    borderTopClassName: "border-t-neutral-700 dark:border-t-neutral-400",
    titleHoverClassName: "group-hover:text-black dark:group-hover:text-neutral-100",
  },
  {
    id: "neutral-d",
    badgeClassName:
      "inline-flex w-fit bg-neutral-600 px-3 py-1 text-xs font-bold tracking-wide text-neutral-100 rounded-none dark:bg-neutral-500 dark:text-neutral-950",
    borderTopClassName: "border-t-neutral-600 dark:border-t-neutral-500",
    titleHoverClassName: "group-hover:text-black dark:group-hover:text-neutral-100",
  },
] as const;

/** Monochrome accent — cycles four neutral weights. */
export function getBlogCardAccent(index: number): BlogCardAccent {
  return BLOG_CARD_ACCENTS[((index % 4) + 4) % 4]!;
}

/** Optional type hint shifts accent while keeping neutral primaries. */
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
