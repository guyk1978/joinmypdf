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

export const dynamic = "force-static";

function localizedPaths(path: string): string[] {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return routing.locales.map((locale) => `/${locale}${normalized === "/" ? "" : normalized}`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const statusMap = readInventoryStatusMap();
  const canonicalTools = getCanonicalTools().filter((tool) =>
    isSitemapIndexableStatus(statusMap[tool.slug]),
  );
  const canonicalSlugSet = new Set(canonicalTools.map((tool) => tool.slug));

  const basePaths = [
    "/",
    "/tools/",
    "/premium-tools/",
    "/blog/",
    "/privacy-first/",
    "/privacy/",
    "/compare/",
    "/contact/",
    "/privacy-first-pdf-tools/",
    "/favicon-tools/",
    "/utilities/",
    "/text-json-tools/",
    "/developer-tools/",
    "/image-tools/",
    "/data-conversion-tools/",
    "/security-tools/",
    "/productivity-tools/",
    "/pdf-guides/",
    "/pdf-comparison/",
    "/pdf-privacy/",
    "/pdf-workflows/",
  ];

  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  const push = (entry: MetadataRoute.Sitemap[number]) => {
    if (seen.has(entry.url)) return;
    seen.add(entry.url);
    entries.push(entry);
  };

  for (const path of basePaths) {
    for (const urlPath of localizedPaths(path)) {
      push({
        url: `${siteUrl}${urlPath}`,
        lastModified: now,
        changeFrequency: path === "/" ? "daily" : "weekly",
        priority: path === "/" ? 1 : 0.85,
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

  // Inventory → sitemap: every active canonical tool (incl. audio + studio)
  for (const tool of canonicalTools) {
    const lastModified = tool.updatedAt ? new Date(tool.updatedAt) : now;
    for (const urlPath of localizedPaths(tool.path)) {
      push({
        url: `${siteUrl}${urlPath}`,
        lastModified,
        changeFrequency: "weekly",
        priority: tool.priority,
      });
    }
  }

  // SEO cluster variants for registry tools (active only)
  for (const tool of registry.tools) {
    if (!canonicalSlugSet.has(tool.slug)) continue;
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
