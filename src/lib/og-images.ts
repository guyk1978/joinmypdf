import type { Metadata } from "next";
import ogManifest from "../../assets/data/og-manifest.json";
import { absoluteUrl } from "@/lib/site";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Slugs with pre-generated blog OG JPEGs (build-time manifest — edge-safe, no node:fs). */
const BLOG_OG_SLUGS = new Set(
  (ogManifest.items ?? [])
    .filter((item) => item.ok !== false && item.slug)
    .map((item) => item.slug as string),
);

/** Locale-specific default social preview (public/og-image-*.png). */
export function localeOgImagePath(locale: string): string {
  return locale === "he" ? "/og-image-he.png" : "/og-image-en.png";
}

export function localeOgImageUrl(locale: string): string {
  return absoluteUrl(localeOgImagePath(locale));
}

export type OgImageDescriptor = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export function buildOgImageDescriptor(imageUrl: string, alt = "JoinMyPDF"): OgImageDescriptor {
  const url = /^https?:\/\//i.test(imageUrl) ? imageUrl : absoluteUrl(imageUrl);
  return { url, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt };
}

export function buildLocaleOgImage(locale: string, alt = "JoinMyPDF"): OgImageDescriptor {
  return buildOgImageDescriptor(localeOgImagePath(locale), alt);
}

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

/** Default Open Graph + Twitter image fields for a page. */
export function buildDefaultSocialImages(
  locale: string,
  options?: { alt?: string; imagePath?: string },
): Pick<Metadata, "openGraph" | "twitter"> {
  const image = buildOgImageDescriptor(options?.imagePath ?? localeOgImagePath(locale), options?.alt);

  return {
    openGraph: {
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      images: [image.url],
    },
  };
}
