import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { routing } from "@/i18n/routing";

export const dynamic = "force-static";

/**
 * Allow full-site crawl, and explicitly permit locale blog trees so Googlebot
 * (and other crawlers) are never blocked from `/en/blog/`, `/he/blog/`, `/ru/blog/`.
 * No Disallow rules — sitemap remains the discovery source of truth.
 */
export default function robots(): MetadataRoute.Robots {
  const blogAllows = [
    "/",
    "/blog/",
    "/blog/*",
    ...routing.locales.flatMap((locale) => [
      `/${locale}/`,
      `/${locale}/blog/`,
      `/${locale}/blog/*`,
    ]),
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: blogAllows,
      },
      {
        userAgent: "Googlebot",
        allow: blogAllows,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl.replace(/^https:\/\//, ""),
  };
}
