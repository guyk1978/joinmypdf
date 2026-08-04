import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { routing } from "@/i18n/routing";

export const dynamic = "force-static";

/**
 * Allow full-site crawl for public marketing, tools, blog, and templates.
 * Explicit Googlebot + locale allows keep blog/tools discoverable even when
 * CDN managed robots prepend AI-bot Disallows.
 * No Disallow rules for public content — sitemap remains discovery source of truth.
 */
export default function robots(): MetadataRoute.Robots {
  const publicAllows = [
    "/",
    "/blog/",
    "/blog/*",
    "/tools/",
    "/tools/*",
    "/templates/",
    "/templates/*",
    ...routing.locales.flatMap((locale) => [
      `/${locale}/`,
      `/${locale}/blog/`,
      `/${locale}/blog/*`,
      `/${locale}/tools/`,
      `/${locale}/tools/*`,
      `/${locale}/templates/`,
      `/${locale}/templates/*`,
      `/${locale}/all-tools`,
      `/${locale}/home`,
      `/${locale}/about`,
      `/${locale}/contact`,
      `/${locale}/compare`,
      `/${locale}/guide`,
      `/${locale}/reviews`,
      `/${locale}/privacy`,
      `/${locale}/privacy-first`,
      `/${locale}/pdf-guides`,
      `/${locale}/pdf-comparison`,
      `/${locale}/pdf-privacy`,
      `/${locale}/pdf-workflows`,
    ]),
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: publicAllows,
      },
      {
        userAgent: "Googlebot",
        allow: publicAllows,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl.replace(/^https:\/\//, ""),
  };
}
