import {
  getToolRegistryCategory,
  TOOL_DEFINITIONS,
  toolPath,
  type SearchIndexEntry,
} from "@/config/tools";
import { getBlogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";
import type { BlogPost } from "@/lib/types";

type Translator = (key: string) => string;

const indexCache = new Map<string, SearchIndexEntry[]>();
const toolMetaBySlug = new Map(registry.tools.map((tool) => [tool.slug, tool]));

function articleMetaDescription(post: BlogPost): string {
  if (post.seo?.metaDescription) return post.seo.metaDescription;
  if (post.description) return post.description;
  return "";
}

function articleMetaKeywords(post: BlogPost): string {
  return [post.keyword, post.seo?.keywords, post.slug.replace(/-/g, " ")].filter(Boolean).join(" ");
}

function toolMetaDescription(slug: string): string {
  const toolMeta = toolMetaBySlug.get(slug);
  if (!toolMeta) return "";
  return toolMeta.description || toolMeta.intent || "";
}

function toolMetaKeywords(slug: string): string {
  const toolMeta = toolMetaBySlug.get(slug);
  if (!toolMeta) return slug.replace(/-/g, " ");
  return [
    toolMeta.primaryKeyword,
    ...(toolMeta.secondaryKeywords ?? []),
    slug.replace(/-/g, " "),
  ]
    .filter(Boolean)
    .join(" ");
}

/** Build the client-side search index for a locale (title + meta fields only). */
export function buildSearchIndex(locale: string, t: Translator): SearchIndexEntry[] {
  const cached = indexCache.get(locale);
  if (cached) return cached;

  const tools: SearchIndexEntry[] = TOOL_DEFINITIONS.map((tool) => {
    const title = t(`navItems.${tool.labelKey}`);
    const registryCategory = getToolRegistryCategory(tool.slug);

    return {
      type: "Tool",
      title,
      path: toolPath(tool.slug),
      category: registryCategory ?? t("nav.pdf"),
      description: toolMetaDescription(tool.slug),
      metaKeywords: toolMetaKeywords(tool.slug),
    };
  });

  const articles: SearchIndexEntry[] = (getBlogRegistry(locale).blog ?? []).map((post) => ({
    type: "Article",
    title: post.title,
    path: `/blog/${post.slug}/`,
    category: post.category ?? t("guides"),
    description: articleMetaDescription(post),
    metaKeywords: articleMetaKeywords(post),
  }));

  const index = [...tools, ...articles];
  indexCache.set(locale, index);
  return index;
}

export type { SearchIndexEntry };
