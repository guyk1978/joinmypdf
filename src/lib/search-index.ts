import {
  ALL_TOOLS_REGISTRY,
  getToolRegistryCategory,
  TOOL_DEFINITIONS,
  toolPath,
  type SearchIndexEntry,
} from "@/config/tools";
import { getBlogRegistry } from "@/lib/blog-registry";
import type { BlogPost } from "@/lib/types";

type Translator = (key: string) => string;

const indexCache = new Map<string, SearchIndexEntry[]>();

function buildSlugCategoryMap(t: Translator): Map<string, string> {
  const map = new Map<string, string>();
  for (const group of ALL_TOOLS_REGISTRY) {
    const category = t(group.labelKey);
    for (const column of group.columns) {
      for (const slug of column.slugs) {
        map.set(slug, category);
      }
    }
  }
  return map;
}

function articleDescription(post: BlogPost): string {
  if (post.description) return post.description;
  if (post.seo?.metaDescription) return post.seo.metaDescription;
  if (post.contentBlocks?.intro) return post.contentBlocks.intro;
  if (post.intent) return post.intent;
  return "";
}

function articleKeywords(post: BlogPost): string {
  return [
    post.title,
    post.keyword,
    post.category,
    post.cluster,
    post.intent,
    post.slug.replace(/-/g, " "),
    articleDescription(post),
  ]
    .filter(Boolean)
    .join(" ");
}

/** Build the full client-side search index for a locale. */
export function buildSearchIndex(locale: string, t: Translator): SearchIndexEntry[] {
  const cached = indexCache.get(locale);
  if (cached) return cached;

  const slugCategories = buildSlugCategoryMap(t);
  const tools: SearchIndexEntry[] = TOOL_DEFINITIONS.map((tool) => {
    const title = t(`navItems.${tool.labelKey}`);
    const registryCategory = getToolRegistryCategory(tool.slug);
    const category = registryCategory ?? slugCategories.get(tool.slug) ?? t("nav.pdf");
    const slugText = tool.slug.replace(/-/g, " ");
    return {
      type: "Tool",
      title,
      path: toolPath(tool.slug),
      category,
      keywords: [title, category, slugText, tool.labelKey.replace(/([A-Z])/g, " $1")].join(" "),
    };
  });

  const articles: SearchIndexEntry[] = (getBlogRegistry(locale).blog ?? []).map((post) => ({
    type: "Article",
    title: post.title,
    path: `/blog/${post.slug}/`,
    category: post.category ?? t("guides"),
    keywords: articleKeywords(post),
    description: articleDescription(post),
  }));

  const index = [...tools, ...articles];
  indexCache.set(locale, index);
  return index;
}

export type { SearchIndexEntry };
