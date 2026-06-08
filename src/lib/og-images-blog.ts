import ogManifest from "../../assets/data/og-manifest.json";
import { localeOgImagePath } from "@/lib/og-images";

/** Slugs with pre-generated blog OG JPEGs (build-time manifest — edge-safe, no node:fs). */
const BLOG_OG_SLUGS = new Set(
  (ogManifest.items ?? [])
    .filter((item) => item.ok !== false && item.slug)
    .map((item) => item.slug as string),
);

type BlogOgPost = {
  slug?: string;
  seo?: {
    ogImage?: string;
    ogVariant?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
};

/** Blog article OG — per-slug JPEG when listed in og-manifest, else locale default. */
export function resolveBlogOgImagePath(post: BlogOgPost, locale: string): string {
  if (post.seo?.ogImage) {
    return post.seo.ogImage;
  }

  const slug = post.slug || "";
  if (slug && BLOG_OG_SLUGS.has(slug)) {
    if (post.seo?.ogVariant === "b") {
      return `/assets/og/variants/${slug}-b.jpg`;
    }
    return `/assets/og/${slug}.jpg`;
  }

  return localeOgImagePath(locale);
}
