import { blogRegistry } from "@/lib/blog-registry";
import { registry } from "@/lib/registry";
import {
  getRelatedToolsFromData,
  getToolsDataEntry,
} from "@/data/tools-data";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { buildLocalizedToolFaqs } from "@/lib/tool-faqs";
import type { ToolPageTranslator } from "@/lib/i18n-tool-page";
import type { ToolDefinition, ToolFaq } from "@/lib/types";

export type ToolModalDocModel = {
  slug: string;
  title: string;
  description: string;
  intent?: string;
  primaryKeyword?: string;
  useCases: string[];
  faqs: ToolFaq[];
};

export type ToolModalRelatedTool = {
  slug: string;
  href: string;
  title: string;
  description?: string;
};

export type ToolModalRelatedArticle = {
  slug: string;
  href: string;
  title: string;
  description?: string;
};

function findRegistryTool(slug: string): ToolDefinition | undefined {
  return registry.tools.find((tool) => tool.slug === slug);
}

/**
 * Full FAQ set for the modal DOC tab — same merge as tool pages
 * (tool-specific + universal), with no truncation.
 */
export function getToolModalFaqs(
  slug: string,
  locale: string,
  toolTitle: string,
  t?: ToolPageTranslator,
): ToolFaq[] {
  const tool = findRegistryTool(slug);
  if (!tool) return [];

  if (t) {
    return buildLocalizedToolFaqs(t, tool, null, toolTitle, locale);
  }

  return tool.faq ?? [];
}

/** Resolve DOC tab content from tools.json + inventory / tools-data fallbacks. */
export function getToolModalDocModel(
  slug: string,
  fallbackTitle?: string,
  options?: {
    locale?: string;
    t?: ToolPageTranslator;
    title?: string;
    description?: string;
  },
): ToolModalDocModel {
  const tool = findRegistryTool(slug);
  const data = getToolsDataEntry(slug);
  const inventory = getToolsInventoryEntry(slug);
  const title =
    options?.title ||
    tool?.title ||
    data?.title ||
    inventory?.title ||
    fallbackTitle ||
    slug;
  const locale = options?.locale ?? "en";
  const description =
    options?.description ||
    tool?.description ||
    data?.description ||
    inventory?.description ||
    "";

  return {
    slug,
    title,
    description,
    intent: tool?.intent,
    primaryKeyword: tool?.primaryKeyword,
    useCases: tool?.useCases ?? [],
    faqs: getToolModalFaqs(slug, locale, title, options?.t),
  };
}

/** Similar tools for the RELATED tab — driven by `TOOLS_DATA[slug].related`. */
export function getToolModalRelatedTools(
  slug: string,
  limit = 8,
  options?: {
    locale?: string;
    localize?: (peerSlug: string, title: string, description?: string) => {
      title: string;
      description?: string;
    };
  },
): ToolModalRelatedTool[] {
  const locale = options?.locale;
  return getRelatedToolsFromData(slug, limit).map((peer) => {
    const localized = options?.localize?.(peer.id, peer.title, peer.description || undefined);
    return {
      slug: peer.id,
      href: locale
        ? // Keep nested path; getRelatedToolsFromData href may be EN — rebuild if needed by caller
          peer.href
        : peer.href,
      title: localized?.title ?? peer.title,
      description: localized?.description ?? (peer.description || undefined),
    };
  });
}

/** Blog posts that reference this tool. */
export function getToolModalRelatedArticles(slug: string, limit = 6): ToolModalRelatedArticle[] {
  const posts = blogRegistry.blog ?? [];
  return posts
    .filter((post) => (post.relatedTools || []).includes(slug))
    .sort((a, b) => Date.parse(b.publishDate || "") - Date.parse(a.publishDate || ""))
    .slice(0, limit)
    .map((post) => ({
      slug: post.slug,
      href: `/blog/${post.slug}/`,
      title: post.title,
      description: post.description ?? post.seo?.metaDescription,
    }));
}

/** Build iframe/embed URL for the CALC tab. */
export function buildToolEmbedHref(href: string, locale: string): string {
  const path = href.startsWith("/") ? href : `/${href}`;
  const withLocale = path.startsWith(`/${locale}/`) ? path : `/${locale}${path}`;
  const url = new URL(withLocale, "https://joinmypdf.local");
  url.searchParams.set("embed", "1");
  return `${url.pathname}${url.search}`;
}
