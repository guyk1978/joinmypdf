import type { MetadataRoute } from "next";
import { blogRegistry } from "@/lib/blog-registry";
import { getCanonicalTools } from "@/lib/canonical-tools";
import {
  isSitemapIndexableStatus,
  readInventoryStatusMap,
} from "@/lib/inventory-status";
import { pdfHubs } from "@/lib/pdf-hubs";
import { registry } from "@/lib/registry";
import { INVOICE_TEMPLATE_PROFILES } from "@/lib/invoice/templates";
import { TIMELINE_TEMPLATE_PROFILES } from "@/lib/timeline/templates";
import { generateClusterVariants } from "@/lib/variants";
import { siteUrl } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { INVENTORY_HUB_META, type InventoryCategoryId } from "@/data/inventory-hubs";
import {
  listNestedSitemapPathsForTool,
  normalizeHubPath,
  resolveToolHref,
} from "@/lib/tool-hierarchy";
import { TOOLS_INVENTORY } from "@/data/tools-inventory";

export const dynamic = "force-static";

function localizedPaths(path: string): string[] {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return routing.locales.map((locale) => `/${locale}${normalized === "/" ? "" : normalized}`);
}

/** Marketing / legal / directory shells — hubs only (tools come from hierarchy). */
const BASE_PATHS = [
  "/",
  "/tools/",
  "/premium-tools/",
  "/blog/",
  "/privacy-first/",
  "/privacy/",
  "/compare/",
  "/contact/",
  "/privacy-first-pdf-tools/",
  "/utilities/",
  "/text-json-tools/",
  "/developer-tools/",
  "/pdf-guides/",
  "/pdf-comparison/",
  "/pdf-privacy/",
  "/pdf-workflows/",
];

function listCategoryHubPaths(): string[] {
  const paths = new Set<string>();
  for (const id of Object.keys(INVENTORY_HUB_META) as InventoryCategoryId[]) {
    const hub = normalizeHubPath(id);
    if (hub && hub !== "/tools/") paths.add(hub);
  }
  return [...paths].sort();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const statusMap = readInventoryStatusMap();
  const canonicalTools = getCanonicalTools().filter((tool) =>
    isSitemapIndexableStatus(statusMap[tool.slug]),
  );
  const canonicalSlugSet = new Set(canonicalTools.map((tool) => tool.slug));

  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  const push = (entry: MetadataRoute.Sitemap[number]) => {
    if (seen.has(entry.url)) return;
    seen.add(entry.url);
    entries.push(entry);
  };

  for (const path of [...BASE_PATHS, ...listCategoryHubPaths()]) {
    for (const urlPath of localizedPaths(path)) {
      push({
        url: `${siteUrl}${urlPath}`,
        lastModified: now,
        changeFrequency: path === "/" ? "daily" : "weekly",
        priority: path === "/" ? 1 : path.startsWith("/tools/") ? 0.88 : 0.85,
      });
    }
  }

  for (const profile of INVOICE_TEMPLATE_PROFILES) {
    for (const urlPath of localizedPaths(`/templates/${profile.slug}/`)) {
      push({
        url: `${siteUrl}${urlPath}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.82,
      });
    }
  }

  for (const profile of TIMELINE_TEMPLATE_PROFILES) {
    for (const urlPath of localizedPaths(`/templates/timeline/${profile.slug}/`)) {
      push({
        url: `${siteUrl}${urlPath}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.82,
      });
    }
  }

  for (const hub of pdfHubs) {
    for (const urlPath of localizedPaths(hub.path)) {
      push({
        url: `${siteUrl}${urlPath}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.88,
      });
    }
  }

  // Hierarchy registry → nested tool URLs for EVERY category membership.
  // Locale-aware: Russian PDF tools use SEO transliterated slugs under /ru/.
  const nestedToolEntries: {
    locale: string;
    path: string;
    lastModified: Date;
    priority: number;
  }[] = [];

  for (const locale of routing.locales) {
    for (const tool of canonicalTools) {
      const lastModified = tool.updatedAt ? new Date(tool.updatedAt) : now;
      const entry = TOOLS_INVENTORY.find((item) => item.id === tool.slug);
      const paths = entry
        ? listNestedSitemapPathsForTool(entry, locale)
        : [
            resolveToolHref(
              tool.slug,
              undefined,
              locale,
            ),
          ];
      for (const nestedPath of paths) {
        nestedToolEntries.push({
          locale,
          path: nestedPath,
          lastModified,
          priority: tool.priority,
        });
      }
    }

    for (const entry of TOOLS_INVENTORY) {
      if (!isSitemapIndexableStatus(statusMap[entry.id])) continue;
      for (const nestedPath of listNestedSitemapPathsForTool(entry, locale)) {
        nestedToolEntries.push({
          locale,
          path: nestedPath,
          lastModified: now,
          priority: 0.9,
        });
      }
    }
  }

  for (const item of nestedToolEntries) {
    push({
      url: `${siteUrl}/${item.locale}${item.path}`,
      lastModified: item.lastModified,
      changeFrequency: "weekly",
      priority: item.priority,
    });
  }

  // SEO cluster variants stay on flat long-tail landings under /tools/{variant}/
  for (const tool of registry.tools) {
    if (!canonicalSlugSet.has(tool.slug)) continue;
    if (tool.skipClusterVariants) continue;
    const lastModified = tool.updatedAt ? new Date(tool.updatedAt) : now;
    const longTailPriority =
      tool.longTailPriority != null && Number.isFinite(Number(tool.longTailPriority))
        ? Number(tool.longTailPriority)
        : 0.58;

    for (const variant of generateClusterVariants(tool, registry)) {
      for (const urlPath of localizedPaths(`/tools/${variant.slug}/`)) {
        push({
          url: `${siteUrl}${urlPath}`,
          lastModified,
          changeFrequency: "weekly",
          priority: longTailPriority,
        });
      }
    }
  }

  for (const post of blogRegistry.blog || []) {
    for (const urlPath of localizedPaths(`/blog/${post.slug}/`)) {
      push({
        url: `${siteUrl}${urlPath}`,
        lastModified: new Date(post.publishDate || now.toISOString().slice(0, 10)),
        changeFrequency: "weekly",
        priority: post.tier1 ? 0.82 : 0.65,
      });
    }
  }

  return entries;
}
