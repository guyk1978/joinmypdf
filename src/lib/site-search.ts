import type { BlogRegistry } from "./types";
import type { SiteRegistry } from "./types";

export type SearchEntryType = "tool" | "guide";

export type SearchEntry = {
  type: SearchEntryType;
  title: string;
  description: string;
  href: string;
};

export type SearchResults = {
  tools: SearchEntry[];
  guides: SearchEntry[];
};

export function buildSiteSearchIndex(registry: SiteRegistry, blog: BlogRegistry): SearchEntry[] {
  const tools: SearchEntry[] = (registry.tools || []).map((tool) => ({
    type: "tool",
    title: tool.title,
    description: tool.description || tool.intent || "",
    href: `/tools/${tool.slug}/`,
  }));

  const guides: SearchEntry[] = (blog.blog || []).map((post) => ({
    type: "guide",
    title: post.title,
    description: post.description || post.seo?.metaDescription || post.intent || "",
    href: `/blog/${post.slug}/`,
  }));

  return [...tools, ...guides];
}

export function filterSearchIndex(
  index: SearchEntry[],
  query: string,
  limitPerGroup = 8,
): SearchResults {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { tools: [], guides: [] };

  const matches = (entry: SearchEntry) => {
    const haystack = `${entry.title} ${entry.description}`.toLowerCase();
    return haystack.includes(q);
  };

  return {
    tools: index.filter((e) => e.type === "tool" && matches(e)).slice(0, limitPerGroup),
    guides: index.filter((e) => e.type === "guide" && matches(e)).slice(0, limitPerGroup),
  };
}
