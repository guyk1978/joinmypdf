import type { MetadataRoute } from "next";
import { blogRegistry } from "@/lib/blog-registry";
import { pdfHubs } from "@/lib/pdf-hubs";
import { registry } from "@/lib/registry";
import { allToolSlugs } from "@/lib/variants";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/tools/`, lastModified: now, changeFrequency: "weekly", priority: 0.92 },
    { url: `${siteUrl}/blog/`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/privacy/`, lastModified: now, changeFrequency: "monthly", priority: 0.72 },
    { url: `${siteUrl}/compare/`, lastModified: now, changeFrequency: "monthly", priority: 0.72 },
    { url: `${siteUrl}/privacy-first-pdf-tools/`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
  ];

  for (const hub of pdfHubs) {
    entries.push({
      url: `${siteUrl}${hub.path}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.88,
    });
  }

  for (const slug of allToolSlugs(registry)) {
    const isBaseTool = registry.tools.some((t) => t.slug === slug);
    entries.push({
      url: `${siteUrl}/tools/${slug}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: isBaseTool ? 0.92 : 0.58,
    });
  }

  for (const post of blogRegistry.blog || []) {
    entries.push({
      url: `${siteUrl}/blog/${post.slug}/`,
      lastModified: new Date(post.publishDate || now.toISOString().slice(0, 10)),
      changeFrequency: "weekly",
      priority: post.tier1 ? 0.82 : 0.65,
    });
  }

  return entries;
}
