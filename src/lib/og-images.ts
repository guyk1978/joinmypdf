import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

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

/** Blog article OG — per-slug JPEG when generated, else locale default. */
export function resolveBlogOgImagePath(post: BlogOgPost, locale: string): string {
  if (post.seo?.ogImage) {
    return post.seo.ogImage;
  }

  const slug = post.slug || "";
  const cwd = typeof process.cwd === "function" ? process.cwd() : "";

  if (slug && cwd) {
    const variant = post.seo?.ogVariant === "b" ? "b" : "a";
    const ogRoot = path.join(cwd, "assets", "og");
    const variantFile = path.join(ogRoot, "variants", `${slug}-b.jpg`);
    const primaryFile = path.join(ogRoot, `${slug}.jpg`);
    const defaultFile = path.join(ogRoot, "default.jpg");
    const legacyDefault = path.join(cwd, "assets", "images", "blog", "og-default.jpg");

    if (variant === "b" && existsSync(variantFile)) return `/assets/og/variants/${slug}-b.jpg`;
    if (existsSync(primaryFile)) return `/assets/og/${slug}.jpg`;
    if (existsSync(defaultFile)) return "/assets/og/default.jpg";
    if (existsSync(legacyDefault)) return "/assets/images/blog/og-default.jpg";
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
