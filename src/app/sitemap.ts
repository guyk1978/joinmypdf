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
    "/tools/pdf-tools/",
    "/favicon-tools/",
    "/tools/favicon-tools/",
    "/tools/png-tools/",
    "/tools/jpg-tools/",
    "/tools/crop-tools/",
    "/tools/word-tools/",
    "/tools/excel-tools/",
    "/tools/rotate-tools/",
    "/tools/extract-tools/",
    "/tools/text-tools/",
    "/tools/compress-tools/",
    "/tools/convert-tools/",
    "/tools/json-tools/",
    "/tools/yaml-tools/",
    "/tools/xml-tools/",
    "/tools/mp3-tools/",
    "/tools/mp4-tools/",
    "/tools/video-tools/",
    "/tools/video-trimmer/",
    "/tools/video-to-gif/",
    "/tools/video-resizer/",
    "/tools/video-compressor/",
    "/tools/video-to-mp3/",
    "/tools/video-muter/",
    "/tools/video-speed/",
    "/tools/video-speed-controller/",
    "/tools/video-rotator/",
    "/tools/video-metadata-cleaner/",
    "/tools/video-converter/",
    "/tools/video-to-mp4/",
    "/tools/developer-tools/",
    "/tools/color-converter/",
    "/tools/image-converter/",
    "/tools/svg-optimizer/",
    "/tools/lorem-ipsum-generator/",
    "/tools/text-workspace/",
    "/tools/pdf-editor/",
    "/tools/sign-pdf-large-files/",
    "/tools/pdf-to-png-no-upload/",
    "/tools/png-to-pdf-instant/",
    "/tools/pdf-to-png-instant/",
    "/tools/png-to-pdf-fast/",
    "/tools/add-page-numbers-online/",
    "/tools/add-page-numbers-free/",
    "/tools/pdf-to-png-fast/",
    "/tools/add-page-numbers-large-files/",
    "/tools/png-to-pdf-no-signup/",
    "/tools/png-to-pdf-online/",
    "/tools/png-to-pdf-high-quality/",
    "/tools/add-page-numbers-instant/",
    "/tools/png-to-pdf-large-files/",
    "/tools/pdf-to-png-large-files/",
    "/tools/sign-pdf-no-signup/",
    "/tools/add-page-numbers-mobile/",
    "/tools/add-page-numbers-fast/",
    "/tools/pdf-to-png-high-quality/",
    "/tools/png-to-pdf-mobile/",
    "/tools/pdf-to-png-free/",
    "/tools/pdf-to-png-secure/",
    "/tools/add-page-numbers-high-quality/",
    "/tools/add-page-numbers-secure/",
    "/tools/png-to-pdf-no-upload/",
    "/tools/sign-pdf-fast/",
    "/tools/add-page-numbers-no-signup/",
    "/tools/sign-pdf-mobile/",
    "/tools/protect-pdf-fast/",
    "/tools/sign-pdf-high-quality/",
    "/tools/sign-pdf-instant/",
    "/tools/pdf-to-png-mobile/",
    "/tools/pdf-to-png-online/",
    "/tools/sign-pdf-online/",
    "/tools/sign-pdf-secure/",
    "/tools/add-page-numbers-no-upload/",
    "/tools/sign-pdf-free/",
    "/tools/pdf-to-png-no-signup/",
    "/tools/delete-pdf-pages-no-signup/",
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
