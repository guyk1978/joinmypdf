import type { Metadata } from "next";
import { getBrandName } from "@/lib/brand";
import { absoluteUrl, siteUrl } from "@/lib/site";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Site-wide Open Graph share image (public/images/). */
export const DEFAULT_OG_IMAGE_PATH = "/images/og-image-multinote-manager.webp";
export const DEFAULT_OG_IMAGE_ALT = "JoinMyPDF Multi-Note Manager preview";

/** Locale-specific fallback previews (public/og-image-*.png). */
export function localeOgImagePath(locale: string): string {
  if (locale === "he") return "/og-image-he.png";
  if (locale === "ru") return "/og-image-ru.png";
  return "/og-image-en.png";
}

export function localeOgImageUrl(locale: string): string {
  return absoluteUrl(localeOgImagePath(locale));
}

export function defaultOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
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

export function buildLocaleOgImage(locale: string, alt = DEFAULT_OG_IMAGE_ALT): OgImageDescriptor {
  return buildOgImageDescriptor(localeOgImagePath(locale), alt);
}

function ogLocaleTag(locale: string): string {
  return locale === "he" ? "he_IL" : locale === "ru" ? "ru_RU" : "en_US";
}

/** Default Open Graph + Twitter image fields for a page. */
export function buildDefaultSocialImages(
  locale: string,
  options?: { alt?: string; imagePath?: string },
): Pick<Metadata, "openGraph" | "twitter"> {
  const image = buildOgImageDescriptor(
    options?.imagePath ?? localeOgImagePath(locale),
    options?.alt ?? DEFAULT_OG_IMAGE_ALT,
  );

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

/**
 * Full openGraph + twitter block for pages that currently only set title /
 * description / alternates. Pass a locale-relative canonical path like
 * `/en/tools/color-palette-extractor/`.
 */
export function buildPageSocialMetadata(options: {
  locale: string;
  title: string;
  description: string;
  /** Locale-prefixed path, e.g. `/he/tools/pdf-editor/`. */
  canonicalPath: string;
  imagePath?: string;
  imageAlt?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const { locale, title, description, canonicalPath } = options;
  const social = buildDefaultSocialImages(locale, {
    alt: options.imageAlt ?? title,
    imagePath: options.imagePath,
  });

  return {
    openGraph: {
      type: "website",
      siteName: getBrandName(locale),
      title,
      description,
      url: canonicalPath.startsWith("http") ? canonicalPath : `${siteUrl}${canonicalPath}`,
      locale: ogLocaleTag(locale),
      ...social.openGraph,
    },
    twitter: {
      title,
      description,
      ...social.twitter,
    },
  };
}

export { siteUrl };
