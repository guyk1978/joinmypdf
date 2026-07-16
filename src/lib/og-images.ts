import type { Metadata } from "next";
import { absoluteUrl, siteUrl } from "@/lib/site";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Site-wide Open Graph share image (public/images/). */
export const DEFAULT_OG_IMAGE_PATH = "/images/og-image-multinote-manager.webp";
export const DEFAULT_OG_IMAGE_ALT = "JoinMyPDF Multi-Note Manager preview";

/** Locale-specific fallback previews (public/og-image-*.png). */
export function localeOgImagePath(locale: string): string {
  return locale === "he" ? "/og-image-he.png" : "/og-image-en.png";
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
  void locale;
  return buildOgImageDescriptor(DEFAULT_OG_IMAGE_PATH, alt);
}

/** Default Open Graph + Twitter image fields for a page. */
export function buildDefaultSocialImages(
  locale: string,
  options?: { alt?: string; imagePath?: string },
): Pick<Metadata, "openGraph" | "twitter"> {
  void locale;
  const image = buildOgImageDescriptor(
    options?.imagePath ?? DEFAULT_OG_IMAGE_PATH,
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

export { siteUrl };
