import type { MetadataRoute } from "next";
import { blogRegistry } from "@/lib/blog-registry";
import { pdfHubs } from "@/lib/pdf-hubs";
import { registry } from "@/lib/registry";
import { INVOICE_TEMPLATE_PROFILES } from "@/lib/invoice/templates";
import { TIMELINE_TEMPLATE_PROFILES } from "@/lib/timeline/templates";
import { allToolSlugs } from "@/lib/variants";
import { siteUrl } from "@/lib/site";
import { routing } from "@/i18n/routing";

export const dynamic = "force-static";

function localizedPaths(path: string): string[] {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return routing.locales.map((locale) => `/${locale}${normalized === "/" ? "" : normalized}`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const basePaths = [
    "/",
    "/tools/",
    "/premium-tools/",
    "/blog/",
    "/privacy-first/",
    "/privacy/",
    "/compare/",
    "/privacy-first-pdf-tools/",
    "/tools/invoice-generator/",
    "/tools/timeline-gantt-generator/",
    "/tools/data-converter-visualizer/",
  ];

  const entries: MetadataRoute.Sitemap = basePaths.flatMap((path) =>
    localizedPaths(path).map((urlPath) => ({
      url: `${siteUrl}${urlPath}`,
      lastModified: now,
      changeFrequency: path === "/" ? ("daily" as const) : ("weekly" as const),
      priority: path === "/" ? 1 : path.startsWith("/tools") ? 0.92 : 0.85,
    })),
  );

  for (const profile of INVOICE_TEMPLATE_PROFILES) {
    for (const urlPath of localizedPaths(`/templates/${profile.slug}/`)) {
      entries.push({
        url: `${siteUrl}${urlPath}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.82,
      });
    }
  }

  for (const profile of TIMELINE_TEMPLATE_PROFILES) {
    for (const urlPath of localizedPaths(`/templates/timeline/${profile.slug}/`)) {
      entries.push({
        url: `${siteUrl}${urlPath}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.82,
      });
    }
  }

  for (const hub of pdfHubs) {
    for (const urlPath of localizedPaths(hub.path)) {
      entries.push({
        url: `${siteUrl}${urlPath}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.88,
      });
    }
  }

  for (const slug of allToolSlugs(registry)) {
    const isBaseTool = registry.tools.some((t) => t.slug === slug);
    for (const urlPath of localizedPaths(`/tools/${slug}/`)) {
      entries.push({
        url: `${siteUrl}${urlPath}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: isBaseTool ? 0.92 : 0.58,
      });
    }
  }

  for (const post of blogRegistry.blog || []) {
    for (const urlPath of localizedPaths(`/blog/${post.slug}/`)) {
      entries.push({
        url: `${siteUrl}${urlPath}`,
        lastModified: new Date(post.publishDate || now.toISOString().slice(0, 10)),
        changeFrequency: "weekly",
        priority: post.tier1 ? 0.82 : 0.65,
      });
    }
  }

  return entries;
}
