import { getToolDisplayLabel } from "./tool-labels";
import { STUDIO_TOOLS } from "./studio-tools";
import type { BlogRegistry } from "./types";
import type { SiteRegistry } from "./types";

export type SearchEntryType = "tool" | "guide";

export type SearchEntry = {
  type: SearchEntryType;
  title: string;
  description: string;
  href: string;
  /** Extra terms for matching (not shown in the UI). */
  keywords: string;
};

export type SearchResults = {
  tools: SearchEntry[];
  guides: SearchEntry[];
};

function cleanSearchDescription(title: string, description: string): string {
  const desc = description.trim();
  if (!desc) return "";
  const titleTail = title.trim().split(/\s+/).slice(-3).join(" ").toLowerCase();
  const descStart = desc.slice(0, Math.min(desc.length, titleTail.length + 8)).toLowerCase();
  if (titleTail && descStart.startsWith(titleTail)) {
    return desc.slice(titleTail.length).replace(/^[\s:—-]+/, "").trim();
  }
  return desc;
}

export function buildSiteSearchIndex(registry: SiteRegistry, blog: BlogRegistry): SearchEntry[] {
  const studio: SearchEntry[] = STUDIO_TOOLS.map((tool) => ({
    type: "tool",
    title: tool.title,
    description: tool.subtitle,
    href: tool.href,
    keywords: [tool.title, tool.subtitle, tool.slug].filter(Boolean).join(" "),
  }));

  const tools: SearchEntry[] = (registry.tools || []).map((tool) => {
    const label = getToolDisplayLabel(tool.slug, tool.title);
    const description = tool.description || tool.intent || "";
    return {
      type: "tool",
      title: label,
      description: cleanSearchDescription(label, description),
      href: `/tools/${tool.slug}/`,
      keywords: [
        label,
        tool.title,
        tool.primaryKeyword,
        tool.intent,
        ...(tool.secondaryKeywords || []),
        tool.slug.replace(/-/g, " "),
      ]
        .filter(Boolean)
        .join(" "),
    };
  });

  const guides: SearchEntry[] = (blog.blog || []).map((post) => {
    const title = post.title;
    const description =
      post.description || post.seo?.metaDescription || post.contentBlocks?.intro || post.intent || "";
    return {
      type: "guide",
      title,
      description: cleanSearchDescription(title, description),
      href: `/blog/${post.slug}/`,
      keywords: [
        title,
        post.keyword,
        post.category,
        post.cluster,
        post.intent,
        post.contentBlocks?.intro,
        post.slug.replace(/-/g, " "),
      ]
        .filter(Boolean)
        .join(" "),
    };
  });

  return [...studio, ...tools, ...guides];
}

export function filterSearchIndex(
  index: SearchEntry[],
  query: string,
  limitPerGroup = 8,
): SearchResults {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { tools: [], guides: [] };

  const score = (entry: SearchEntry) => {
    const title = entry.title.toLowerCase();
    const haystack = `${entry.title} ${entry.description} ${entry.keywords}`.toLowerCase();
    if (!haystack.includes(q)) return -1;
    if (title.startsWith(q)) return 100;
    if (title.includes(q)) return 80;
    if (entry.keywords.toLowerCase().includes(q)) return 60;
    return 40;
  };

  const rank = (entries: SearchEntry[]) =>
    entries
      .map((entry) => ({ entry, points: score(entry) }))
      .filter((row) => row.points >= 0)
      .sort((a, b) => b.points - a.points || a.entry.title.localeCompare(b.entry.title))
      .slice(0, limitPerGroup)
      .map((row) => row.entry);

  return {
    tools: rank(index.filter((e) => e.type === "tool")),
    guides: rank(index.filter((e) => e.type === "guide")),
  };
}
