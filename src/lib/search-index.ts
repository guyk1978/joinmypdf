import {
  ALL_TOOLS_REGISTRY,
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

const TOOL_SYNONYM_HINTS: Record<string, string[]> = {
  audio: ["audio", "sound", "song", "voice", "music", "mp3", "wav", "aac", "flac", "m4a"],
  video: ["video", "movie", "clip", "mp4", "mov", "avi", "mkv", "webm", "gif"],
  image: ["image", "photo", "picture", "jpg", "jpeg", "png", "webp", "heic", "svg", "ico", "favicon"],
  pdf: ["pdf", "document", "acrobat"],
  table: ["csv", "excel", "spreadsheet", "xls", "xlsx", "table", "tabular", "tsv"],
  text: ["text", "txt", "markdown", "html", "json", "yaml", "xml", "sql"],
};

function inferToolHints(slug: string, category: string): string[] {
  const source = `${slug} ${category}`.toLowerCase();
  const hints = new Set<string>();
  if (/audio|mp3|wav|aac|flac|m4a/.test(source)) {
    TOOL_SYNONYM_HINTS.audio.forEach((item) => hints.add(item));
  }
  if (/video|mp4|gif|mov|avi|mkv|webm/.test(source)) {
    TOOL_SYNONYM_HINTS.video.forEach((item) => hints.add(item));
    // Video pipelines frequently handle audio extraction/codec changes as well.
    ["audio", "sound", "mp3", "wav", "aac", "m4a"].forEach((item) => hints.add(item));
  }
  if (/image|jpg|jpeg|png|heic|svg|ico|favicon/.test(source)) {
    TOOL_SYNONYM_HINTS.image.forEach((item) => hints.add(item));
  }
  if (/pdf/.test(source)) {
    TOOL_SYNONYM_HINTS.pdf.forEach((item) => hints.add(item));
  }
  if (/csv|excel|spreadsheet|xlsx|xls|table|json-to-csv|csv-to-json/.test(source)) {
    TOOL_SYNONYM_HINTS.table.forEach((item) => hints.add(item));
  }
  if (/json|yaml|markdown|html|sql|text/.test(source)) {
    TOOL_SYNONYM_HINTS.text.forEach((item) => hints.add(item));
  }
  return [...hints];
}

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
    post.seo?.keywords,
    ...(post.relatedTools ?? []),
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
    const toolMeta = toolMetaBySlug.get(tool.slug);
    const slugText = tool.slug.replace(/-/g, " ");
    const metadataKeywords = [
      toolMeta?.primaryKeyword,
      toolMeta?.intent,
      toolMeta?.operation,
      toolMeta?.category,
      ...(toolMeta?.secondaryKeywords ?? []),
      ...(toolMeta?.useCases ?? []),
      ...(toolMeta?.relatedTools ?? []),
    ]
      .filter(Boolean)
      .join(" ");
    const priorityHints = inferToolHints(tool.slug, `${category} ${metadataKeywords}`);
    return {
      type: "Tool",
      title,
      path: toolPath(tool.slug),
      category,
      keywords: [title, category, slugText, tool.labelKey.replace(/([A-Z])/g, " $1"), metadataKeywords, priorityHints.join(" ")].join(" "),
      tags: [category, ...(toolMeta?.secondaryKeywords ?? [])],
      priorityHints,
    };
  });

  const articles: SearchIndexEntry[] = (getBlogRegistry(locale).blog ?? []).map((post) => {
    const tags = [
      post.category,
      post.cluster,
      post.keyword,
      post.intent,
      post.seo?.keywords,
      ...(post.relatedTools ?? []),
    ].filter(Boolean) as string[];
    return {
      type: "Article",
      title: post.title,
      path: `/blog/${post.slug}/`,
      category: post.category ?? t("guides"),
      keywords: articleKeywords(post),
      description: articleDescription(post),
      tags,
      priorityHints: inferToolHints(post.slug, tags.join(" ")),
    };
  });

  const index = [...tools, ...articles];
  indexCache.set(locale, index);
  return index;
}

export type { SearchIndexEntry };
